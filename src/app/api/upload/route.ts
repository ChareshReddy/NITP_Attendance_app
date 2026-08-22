import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const dest = formData.get('dest') as string || 'misc';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize destination to avoid path traversal
    const safeDest = dest.replace(/[^a-zA-Z0-9_\-]/g, '');

    // Directory path: public/uploads/<safeDest>
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeDest);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique name using timestamp and original name
    const originalName = (file as any).name || 'upload.bin';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}_${sanitizedName}`;
    const filePath = path.join(uploadDir, uniqueName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${safeDest}/${uniqueName}`;
    return NextResponse.json({ success: true, url: fileUrl, filename: originalName });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
