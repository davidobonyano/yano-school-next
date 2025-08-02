import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, sendWelcomeEmail } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const studentSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  studentId: z.string().optional(), // For existing students
  grade: z.string().optional(),
  section: z.string().optional(),
  dateOfBirth: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
});

const teacherSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  department: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  qualification: z.string().optional(),
  experience: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, ...data } = body;

    if (role === 'STUDENT') {
      const validatedData = studentSignupSchema.parse(data);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      // If studentId is provided, check if it exists in the system
      if (validatedData.studentId) {
        const existingStudent = await prisma.user.findUnique({
          where: { studentId: validatedData.studentId },
        });

        if (existingStudent) {
          return NextResponse.json(
            { error: 'Student ID already exists in the system' },
            { status: 400 }
          );
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: 'STUDENT',
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          studentId: validatedData.studentId,
          grade: validatedData.grade,
          section: validatedData.section,
          dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
          parentName: validatedData.parentName,
          parentPhone: validatedData.parentPhone,
          address: validatedData.address,
        },
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.firstName || '', 'Student');
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      return NextResponse.json({
        message: 'Student account created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
        },
      });

    } else if (role === 'TEACHER') {
      const validatedData = teacherSignupSchema.parse(data);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          role: 'TEACHER',
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          department: validatedData.department,
          subjects: validatedData.subjects || [],
          qualification: validatedData.qualification,
          experience: validatedData.experience,
        },
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.firstName || '', 'Teacher');
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      return NextResponse.json({
        message: 'Teacher account created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}