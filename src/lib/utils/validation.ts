import { z } from 'zod';
import type { ZodIssue } from 'zod';

// Basic email validation using Zod
export function validateEmail(email: unknown): string | null {
    const schema = z.string().email({ message: 'Invalid email address format.' });
    const result = schema.safeParse(email);
    if (!result.success) {
        // Combine multiple errors if necessary, though email() usually gives one.
        return result.error.errors.map((e: ZodIssue) => e.message).join(' ');
    }
    return null; // Indicates valid email
}

// Password validation based on requirements
export function validatePassword(password: unknown): string | null {
    const passwordSchema = z
        .string()
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .refine((val: string) => val.trim() === val, {
            message: 'Password cannot start or end with spaces.'
        })
        .refine((val: string) => /^[!-~]+$/.test(val), {
            // Allows printable ASCII characters excluding space.
            // Adjust regex if specific symbols are disallowed/required.
            message: 'Password contains invalid characters. Use letters, numbers, and standard symbols.'
        });

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
        // Combine multiple errors if necessary
        return result.error.errors.map((e: ZodIssue) => e.message).join(' ');
    }
    return null; // Indicates valid password
}

// Utility to validate form data object
export function validateFormData<T extends z.ZodRawShape>(
    formData: FormData,
    schema: z.ZodObject<T>
): { data?: z.infer<typeof schema>; errors?: z.inferFlattenedErrors<typeof schema>['fieldErrors'] } {
    const data = Object.fromEntries(formData);
    const result = schema.safeParse(data);

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors };
    }
    return { data: result.data };
} 