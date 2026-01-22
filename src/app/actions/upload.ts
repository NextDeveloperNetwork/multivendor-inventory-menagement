'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImage(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { error: 'No file uploaded' };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define the path relative to the root public directory
        const uploadDir = join(process.cwd(), 'public', 'uploads');

        // Ensure the directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Already exists or other error handled by the next step
        }

        // Generate a unique filename
        const ext = file.name.split('.').pop() || 'png';
        const filename = `${uuidv4()}.${ext}`;
        const path = join(uploadDir, filename);

        // Write the file to disk
        await writeFile(path, buffer);

        // Return the public URL path
        return {
            success: true,
            url: `/uploads/${filename}`
        };
    } catch (error) {
        console.error('Upload error:', error);
        return { error: 'Failed to save image' };
    }
}
