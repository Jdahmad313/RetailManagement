using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MimeKit.Text;
using RetailManagement.Application.DTOs.Orders;
using RetailManagement.Application.Interfaces.Services;
using RetailManagement.Domain.Entities;

namespace RetailManagement.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlBody, CancellationToken ct = default)
    {
        var smtpHost = _configuration["EmailSettings:SmtpHost"];
        var smtpPortStr = _configuration["EmailSettings:SmtpPort"];
        var senderEmail = _configuration["EmailSettings:SenderEmail"] ?? "no-reply@apexretail.local";
        var senderName = _configuration["EmailSettings:SenderName"] ?? "Apex Retail System";
        var username = _configuration["EmailSettings:Username"];
        var password = _configuration["EmailSettings:Password"];
        var enableSsl = bool.TryParse(_configuration["EmailSettings:EnableSsl"], out var ssl) && ssl;

        int port = 587;
        if (!string.IsNullOrEmpty(smtpPortStr)) int.TryParse(smtpPortStr, out port);

        // DEV / MOCK FALLBACK: If SMTP host is not configured or credentials are blank, log to console
        if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("\n================== [EMAIL DISPATCH - DEV SIMULATION] ==================\n" +
                               "SMTP credentials not fully set (Host: '{Host}', User: '{User}', HasPassword: {HasPass}).\n" +
                               "TO: {ToName} <{ToEmail}>\n" +
                               "SUBJECT: {Subject}\n" +
                               "------------------------------------------------------------------------\n" +
                               "{BodySnippet}\n" +
                               "========================================================================\n",
                               smtpHost, username, !string.IsNullOrWhiteSpace(password), toName, toEmail, subject, htmlBody.Length > 600 ? htmlBody[..600] + "..." : htmlBody);
            return true;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

            using var client = new SmtpClient();
            var secureOption = enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
            await client.ConnectAsync(smtpHost, port, secureOption, ct);
            await client.AuthenticateAsync(username, password, ct);

            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);
            _logger.LogInformation("Email sent successfully to {ToEmail} via {Host}:{Port}", toEmail, smtpHost, port);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail} via SMTP: {Message}", toEmail, ex.Message);
            return false;
        }
    }

    public async Task<bool> SendOtpEmailAsync(string toEmail, string customerName, string otpCode, CancellationToken ct = default)
    {
        var subject = $"Your Apex Retail Verification Code: {otpCode}";
        var html = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;'>
  <div style='max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px;'>
    <div style='text-align: center; margin-bottom: 24px;'>
      <div style='display: inline-block; background: #2563eb; color: #ffffff; font-weight: bold; font-size: 20px; border-radius: 8px; padding: 8px 16px;'>Apex Retail</div>
    </div>
    <h2 style='color: #0f172a; font-size: 20px; margin-top: 0;'>Verify Your Account</h2>
    <p style='color: #475569; font-size: 15px; line-height: 1.5;'>Hello <strong>{customerName}</strong>,</p>
    <p style='color: #475569; font-size: 15px; line-height: 1.5;'>Thank you for signing up. Please enter the following 6-digit one-time password (OTP) to verify your account and complete your registration:</p>
    <div style='background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0;'>
      <span style='font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8;'>{otpCode}</span>
    </div>
    <p style='color: #64748b; font-size: 13px; line-height: 1.5;'>⏱️ This code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
    <hr style='border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;' />
    <p style='color: #94a3b8; font-size: 12px; text-align: center;'>Apex Retail Multi-channel Management System &copy; {DateTime.UtcNow.Year}</p>
  </div>
</body>
</html>";
        return await SendEmailAsync(toEmail, customerName, subject, html, ct);
    }

    public async Task<bool> SendOrderInvoiceAsync(OrderDto order, BusinessProfile profile, CancellationToken ct = default)
    {
        var subject = $"Order Confirmed! Invoice #{order.OrderNumber} - {profile.BusinessName}";

        var itemsHtml = string.Join("", order.Items.Select(item => $@"
          <tr>
            <td style='padding: 10px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;'>{item.ProductName}</td>
            <td style='padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569; font-size: 14px;'>{item.Quantity}</td>
            <td style='padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #475569; font-size: 14px;'>{profile.CurrencySymbol}{item.UnitPrice:F2}</td>
            <td style='padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;'>{profile.CurrencySymbol}{item.Total:F2}</td>
          </tr>"));

        var html = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;'>
  <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px;'>
    <div style='display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;'>
      <div>
        <h1 style='color: #0f172a; font-size: 22px; margin: 0;'>{profile.BusinessName}</h1>
        <p style='color: #64748b; font-size: 13px; margin: 4px 0 0;'>{profile.Tagline}</p>
      </div>
      <div style='text-align: right;'>
        <span style='background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;'>CONFIRMED</span>
        <p style='color: #475569; font-size: 13px; font-weight: 600; margin: 4px 0 0;'>Invoice #{order.OrderNumber}</p>
      </div>
    </div>

    <p style='color: #334155; font-size: 15px;'>Hello <strong>{order.CustomerName}</strong>,</p>
    <p style='color: #475569; font-size: 14px; line-height: 1.5;'>Thank you for your order! We are preparing your items for delivery. Below is your official receipt.</p>

    <div style='background: #f8fafc; border-radius: 6px; padding: 14px; margin: 18px 0; font-size: 13px; color: #475569;'>
      <div><strong>Payment Method:</strong> {order.PaymentMethod} ({order.PaymentStatus})</div>
      <div><strong>Order Date:</strong> {order.CreatedAtUtc:MMMM dd, yyyy HH:mm} UTC</div>
      <div><strong>Customer Contact:</strong> {order.CustomerEmail} | {order.CustomerPhone ?? "N/A"}</div>
    </div>

    <table style='width: 100%; border-collapse: collapse; margin-top: 16px;'>
      <thead>
        <tr style='background: #f1f5f9;'>
          <th style='padding: 10px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase;'>Item</th>
          <th style='padding: 10px; text-align: center; font-size: 12px; color: #475569; text-transform: uppercase;'>Qty</th>
          <th style='padding: 10px; text-align: right; font-size: 12px; color: #475569; text-transform: uppercase;'>Price</th>
          <th style='padding: 10px; text-align: right; font-size: 12px; color: #475569; text-transform: uppercase;'>Total</th>
        </tr>
      </thead>
      <tbody>
        {itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan='3' style='padding: 8px 10px; text-align: right; color: #64748b; font-size: 13px;'>Subtotal:</td>
          <td style='padding: 8px 10px; text-align: right; font-weight: 600; color: #334155; font-size: 13px;'>{profile.CurrencySymbol}{order.SubTotal:F2}</td>
        </tr>
        <tr>
          <td colspan='3' style='padding: 8px 10px; text-align: right; color: #64748b; font-size: 13px;'>Tax:</td>
          <td style='padding: 8px 10px; text-align: right; color: #64748b; font-size: 13px;'>{profile.CurrencySymbol}{order.TaxAmount:F2}</td>
        </tr>
        <tr>
          <td colspan='3' style='padding: 8px 10px; text-align: right; color: #64748b; font-size: 13px;'>Delivery Fee:</td>
          <td style='padding: 8px 10px; text-align: right; color: #64748b; font-size: 13px;'>{profile.CurrencySymbol}{order.ShippingFee:F2}</td>
        </tr>
        <tr>
          <td colspan='3' style='padding: 12px 10px; text-align: right; font-weight: 800; font-size: 16px; color: #0f172a; border-top: 2px solid #e2e8f0;'>Grand Total:</td>
          <td style='padding: 12px 10px; text-align: right; font-weight: 800; font-size: 16px; color: #1d4ed8; border-top: 2px solid #e2e8f0;'>{profile.CurrencySymbol}{order.TotalAmount:F2}</td>
        </tr>
      </tfoot>
    </table>

    <div style='margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px;'>
      <div>Questions? Contact us at <strong>{profile.Email}</strong> or call <strong>{profile.Phone}</strong></div>
      <div style='margin-top: 4px;'>{profile.ReceiptFooter}</div>
    </div>
  </div>
</body>
</html>";
        return await SendEmailAsync(order.CustomerEmail, order.CustomerName, subject, html, ct);
    }

    public async Task<bool> SendCashierInviteAsync(string toEmail, string cashierName, string temporaryPassword, string portalUrl, CancellationToken ct = default)
    {
        var subject = "You have been invited as Cashier - Apex Retail POS Portal";
        var html = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;'>
  <div style='max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px;'>
    <h2 style='color: #0f172a; font-size: 20px; margin-top: 0;'>Staff Invitation: Cashier Account</h2>
    <p style='color: #475569; font-size: 15px;'>Hello <strong>{cashierName}</strong>,</p>
    <p style='color: #475569; font-size: 15px; line-height: 1.5;'>An administrator has created a Cashier account for you on the Apex Retail Point of Sale (POS) system. Here are your login credentials:</p>
    
    <div style='background: #f1f5f9; border-radius: 6px; padding: 16px; margin: 20px 0; font-family: monospace; font-size: 14px;'>
      <div><strong>Portal:</strong> <a href='{portalUrl}' style='color: #2563eb;'>{portalUrl}</a></div>
      <div style='margin-top: 6px;'><strong>Email:</strong> {toEmail}</div>
      <div style='margin-top: 6px;'><strong>Temporary Password:</strong> <span style='color: #b91c1c;'>{temporaryPassword}</span></div>
    </div>

    <p style='color: #475569; font-size: 14px;'>Please log in to begin processing in-store customer sales on the POS terminal. For security, change your password upon your first login.</p>
    <div style='text-align: center; margin-top: 24px;'>
      <a href='{portalUrl}' style='display: inline-block; background: #2563eb; color: #ffffff; font-weight: 600; padding: 12px 24px; border-radius: 6px; text-decoration: none;'>Sign In to POS Terminal</a>
    </div>
  </div>
</body>
</html>";
        return await SendEmailAsync(toEmail, cashierName, subject, html, ct);
    }
}
