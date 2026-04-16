/**
 * Email Service for Walmart Real Estate
 * Sends LOI notifications to brokers
 */

const nodemailer = require('nodemailer');

// Email configuration - update these for production
const EMAIL_CONFIG = {
    // For testing: use ethereal.email (fake SMTP that captures emails)
    // For production: use your company SMTP server
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
};

// Create reusable transporter
let transporter = null;

async function initializeTransporter() {
    if (transporter) return transporter;
    
    // If no SMTP credentials, create test account
    if (!EMAIL_CONFIG.auth.user) {
        console.log('📧 No SMTP credentials found - creating test email account...');
        try {
            const testAccount = await nodemailer.createTestAccount();
            EMAIL_CONFIG.host = 'smtp.ethereal.email';
            EMAIL_CONFIG.port = 587;
            EMAIL_CONFIG.auth.user = testAccount.user;
            EMAIL_CONFIG.auth.pass = testAccount.pass;
            console.log('📧 Test email account created:', testAccount.user);
        } catch (err) {
            console.log('📧 Could not create test account - emails will be logged only');
            return null;
        }
    }
    
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    return transporter;
}

/**
 * Send LOI notification email to broker(s)
 */
async function sendLOINotification({ brokers, property, loiData, submitterInfo }) {
    const transport = await initializeTransporter();
    
    if (!transport) {
        console.log('📧 EMAIL (not sent - no transport):', {
            to: brokers.map(b => b.email),
            subject: `New LOI Submission: ${property.city}, ${property.state}`,
            property: property.title
        });
        return { sent: false, reason: 'No email transport configured' };
    }
    
    const emailResults = [];
    
    for (const broker of brokers) {
        const emailContent = generateLOIEmailHTML({ broker, property, loiData, submitterInfo });
        
        try {
            const info = await transport.sendMail({
                from: '"Walmart Real Estate" <noreply@walmart.com>',
                to: broker.email,
                subject: `🏢 New LOI Submission: ${property.city}, ${property.state}`,
                html: emailContent,
                text: generateLOIEmailText({ broker, property, loiData, submitterInfo })
            });
            
            console.log(`📧 Email sent to ${broker.email}:`, info.messageId);
            
            // For test accounts, show preview URL
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('📧 Preview URL:', previewUrl);
            }
            
            emailResults.push({
                broker: broker.name,
                email: broker.email,
                sent: true,
                messageId: info.messageId,
                previewUrl: previewUrl || null
            });
        } catch (error) {
            console.error(`📧 Failed to send email to ${broker.email}:`, error.message);
            emailResults.push({
                broker: broker.name,
                email: broker.email,
                sent: false,
                error: error.message
            });
        }
    }
    
    return emailResults;
}

/**
 * Generate HTML email content for LOI notification
 */
function generateLOIEmailHTML({ broker, property, loiData, submitterInfo }) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0053e2; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏢 New LOI Submission</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
        <p style="margin-top: 0;">Hi ${broker.name},</p>
        
        <p>A new Letter of Intent has been submitted for a property in your territory.</p>
        
        <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #0053e2; margin-top: 0; font-size: 18px;">Property Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #666;">Location:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${property.city}, ${property.state} ${property.zip || ''}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Property Type:</td>
                    <td style="padding: 8px 0;">${property.type || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Listing Type:</td>
                    <td style="padding: 8px 0;">${property.listing_type === 'sale' ? 'For Sale' : 'For Lease'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Size:</td>
                    <td style="padding: 8px 0;">${property.size_acres ? property.size_acres + ' acres' : 'N/A'}</td>
                </tr>
            </table>
        </div>
        
        <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #0053e2; margin-top: 0; font-size: 18px;">Submitter Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #666;">Name:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${submitterInfo.name || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Email:</td>
                    <td style="padding: 8px 0;"><a href="mailto:${submitterInfo.email}" style="color: #0053e2;">${submitterInfo.email || 'N/A'}</a></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Phone:</td>
                    <td style="padding: 8px 0;">${submitterInfo.phone || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #666;">Company:</td>
                    <td style="padding: 8px 0;">${submitterInfo.company || 'N/A'}</td>
                </tr>
            </table>
        </div>
        
        <div style="background: #ffc220; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #333;">
                Please review and respond to this inquiry within 24-48 hours.
            </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-bottom: 0;">
            This is an automated notification from the Walmart Real Estate system.
        </p>
    </div>
    
    <div style="background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Walmart Real Estate</p>
    </div>
</body>
</html>
    `;
}

/**
 * Generate plain text email content for LOI notification
 */
function generateLOIEmailText({ broker, property, loiData, submitterInfo }) {
    return `
NEW LOI SUBMISSION
==================

Hi ${broker.name},

A new Letter of Intent has been submitted for a property in your territory.

PROPERTY DETAILS
----------------
Location: ${property.city}, ${property.state} ${property.zip || ''}
Property Type: ${property.type || 'N/A'}
Listing Type: ${property.listing_type === 'sale' ? 'For Sale' : 'For Lease'}
Size: ${property.size_acres ? property.size_acres + ' acres' : 'N/A'}

SUBMITTER INFORMATION
---------------------
Name: ${submitterInfo.name || 'N/A'}
Email: ${submitterInfo.email || 'N/A'}
Phone: ${submitterInfo.phone || 'N/A'}
Company: ${submitterInfo.company || 'N/A'}

Please review and respond to this inquiry within 24-48 hours.

---
This is an automated notification from the Walmart Real Estate system.
    `.trim();
}

/**
 * Send contact inquiry email to Real Estate Dispositions team
 */
async function sendContactInquiry({ inquiry, property }) {
    const transport = await initializeTransporter();
    
    const recipientEmail = 'realestatedispositions@walmart.com';
    
    if (!transport) {
        console.log('📧 CONTACT INQUIRY (not sent - no transport):', {
            to: recipientEmail,
            subject: `New Inquiry: ${inquiry.name}`,
            inquiry: inquiry
        });
        return { sent: false, reason: 'No email transport configured' };
    }
    
    const emailContent = generateContactEmailHTML({ inquiry, property });
    
    try {
        const info = await transport.sendMail({
            from: '"Walmart Real Estate" <noreply@walmart.com>',
            to: recipientEmail,
            replyTo: inquiry.email,
            subject: `🏢 New Website Inquiry: ${inquiry.name}${property ? ` - ${property.city}, ${property.state}` : ''}`,
            html: emailContent,
            text: generateContactEmailText({ inquiry, property })
        });
        
        console.log(`📧 Contact inquiry email sent:`, info.messageId);
        
        // For test accounts, show preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('📧 Preview URL:', previewUrl);
        }
        
        return { sent: true, messageId: info.messageId, previewUrl };
    } catch (error) {
        console.error('📧 Failed to send contact inquiry email:', error.message);
        return { sent: false, reason: error.message };
    }
}

/**
 * Generate HTML email for contact inquiry
 */
function generateContactEmailHTML({ inquiry, property }) {
    const propertySection = property ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #0071ce; margin-top: 0;">📍 Property of Interest</h3>
            <table style="width: 100%;">
                <tr><td style="padding: 5px 0; color: #666;">Property:</td><td style="padding: 5px 0;"><strong>${property.title || `${property.city}, ${property.state}`}</strong></td></tr>
                <tr><td style="padding: 5px 0; color: #666;">Location:</td><td style="padding: 5px 0;">${property.city}, ${property.state} ${property.zip || ''}</td></tr>
                <tr><td style="padding: 5px 0; color: #666;">Type:</td><td style="padding: 5px 0;">${property.type || 'N/A'}</td></tr>
                <tr><td style="padding: 5px 0; color: #666;">Size:</td><td style="padding: 5px 0;">${property.size_acres ? property.size_acres + ' acres' : 'N/A'}</td></tr>
            </table>
        </div>
    ` : '';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0071ce; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
                .info-box { background: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0071ce; }
                .message-box { background: #fff9e6; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc220; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">New Website Inquiry</h1>
                </div>
                <div class="content">
                    <div class="info-box">
                        <h3 style="color: #0071ce; margin-top: 0;">👤 Contact Information</h3>
                        <table style="width: 100%;">
                            <tr><td style="padding: 5px 0; color: #666; width: 100px;">Name:</td><td style="padding: 5px 0;"><strong>${inquiry.name}</strong></td></tr>
                            <tr><td style="padding: 5px 0; color: #666;">Email:</td><td style="padding: 5px 0;"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
                            <tr><td style="padding: 5px 0; color: #666;">Phone:</td><td style="padding: 5px 0;">${inquiry.phone || 'Not provided'}</td></tr>
                            <tr><td style="padding: 5px 0; color: #666;">Company:</td><td style="padding: 5px 0;">${inquiry.company || 'Not provided'}</td></tr>
                        </table>
                    </div>
                    
                    ${propertySection}
                    
                    <div class="message-box">
                        <h3 style="color: #b8860b; margin-top: 0;">💬 Message</h3>
                        <p style="white-space: pre-wrap;">${inquiry.message}</p>
                    </div>
                </div>
                <div class="footer">
                    <p>This inquiry was submitted via the Walmart Real Estate website.<br>
                    Submitted on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate plain text email for contact inquiry
 */
function generateContactEmailText({ inquiry, property }) {
    const propertySection = property ? `
PROPERTY OF INTEREST
--------------------
Property: ${property.title || `${property.city}, ${property.state}`}
Location: ${property.city}, ${property.state} ${property.zip || ''}
Type: ${property.type || 'N/A'}
Size: ${property.size_acres ? property.size_acres + ' acres' : 'N/A'}
` : '';
    
    return `
NEW WEBSITE INQUIRY
===================

CONTACT INFORMATION
-------------------
Name: ${inquiry.name}
Email: ${inquiry.email}
Phone: ${inquiry.phone || 'Not provided'}
Company: ${inquiry.company || 'Not provided'}
${propertySection}
MESSAGE
-------
${inquiry.message}

---
Submitted on: ${new Date().toLocaleString()}
This inquiry was submitted via the Walmart Real Estate website.
    `.trim();
}

module.exports = {
    sendLOINotification,
    sendContactInquiry,
    initializeTransporter
};
