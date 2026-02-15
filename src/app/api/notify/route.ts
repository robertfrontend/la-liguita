
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Send email to YOU (Admin)
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to yourself
      subject: `New Early Access Signup: ${email}`,
      text: `A new user has requested early access.\n\nEmail: ${email}\nTime: ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>🚀 New Early Access Request</h2>
          <p>Someone wants to join La Liguita!</p>
          <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Email:</strong> ${email}<br/>
            <strong>Time:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ message: 'Error sending email' }, { status: 500 });
  }
}
