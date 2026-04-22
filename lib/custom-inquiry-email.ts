import { WizardState, SHAPES, ShapeId } from '@/lib/custom-inquiry-types'

export function buildEmailHtml(
  state: WizardState,
  shapeData: typeof SHAPES[number] | undefined,
  signedUrls: string[]
): string {
  const { shape, otherShapeDescription, colors, details, uploads, order } = state

  const dims = shapeData
    ? (shapeData.isCircle ? `${shapeData.width}mm` : `${shapeData.width}mm × ${shapeData.height}mm`)
    : ''

  const colorSwatches = (colors ?? []).map(c => {
    const display = [c.name, c.hex].filter(Boolean).join(' · ')
    const role = c.label ? ` — ${c.label}` : ''
    return `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:12px;">
      <span style="display:inline-block;width:16px;height:16px;background:${c.hex};border-radius:3px;border:1px solid rgba(255,255,255,0.2);"></span>
      <span style="color:#D1D5DB;font-size:13px;">${display}${role}</span>
    </span>`
  }).join('')

  const imageExts = /\.(jpe?g|png|gif|webp|svg)$/i
  const fileLinks = signedUrls.length > 0
    ? signedUrls.map((url, i) => {
        const fileName = (uploads ?? [])[i]?.name ?? `File ${i + 1}`
        const isImage = imageExts.test(fileName)
        return isImage
          ? `<li style="list-style:none;margin-bottom:16px;">
               <img src="${url}" alt="${fileName}" style="max-width:100%;border-radius:6px;border:1px solid rgba(217,119,6,0.2);display:block;margin-bottom:6px;" />
               <a href="${url}" style="color:#D97706;font-size:12px;">${fileName}</a>
             </li>`
          : `<li><a href="${url}" style="color:#D97706;">${fileName}</a></li>`
      }).join('')
    : '<li style="color:#6B7280;">No files attached</li>'

  const additionalLines = (details?.additionalLines ?? []).filter(Boolean)
  const attachment = order.attachment === 'bead_chain' ? 'Bead Chain' : 'Hemp Twine'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;color:#D97706;font-size:11px;letter-spacing:4px;text-transform:uppercase;">TOMMYBOY DESIGNS</p>
          <p style="margin:4px 0 0;color:#6B7280;font-size:10px;">New Custom Tag Inquiry</p>
        </td></tr>
        <tr><td style="background:#111827;border:1px solid rgba(217,119,6,0.2);border-radius:8px;padding:36px;">
          <p style="margin:0 0 20px;color:#D97706;font-size:13px;letter-spacing:3px;text-transform:uppercase;">Inquiry from ${order.name}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;" width="140">Shape</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${shapeData?.label ?? shape}${dims ? ` — ${dims}` : ''}${shape === 'other' && otherShapeDescription ? `<br><span style="color:#9CA3AF;font-size:13px;">${otherShapeDescription}</span>` : ''}</td>
            </tr>
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Colors</td>
              <td style="padding-bottom:8px;">${colorSwatches || '<span style="color:#6B7280;">None specified</span>'}</td>
            </tr>
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Distillery</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${details?.distillery ?? '—'}</td>
            </tr>
            ${details?.year ? `<tr><td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Year</td><td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${details.year}</td></tr>` : ''}
            ${details?.batchValue ? `<tr><td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">${details.batchType === 'store_pick' ? 'Store Pick' : 'Batch'}</td><td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${details.batchValue}</td></tr>` : ''}
            ${additionalLines.length > 0 ? `<tr><td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Extra Text</td><td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${additionalLines.join('<br>')}</td></tr>` : ''}
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Attachment</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${attachment}</td>
            </tr>
            <tr>
              <td style="color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;padding-bottom:8px;">Quantity</td>
              <td style="color:#D1D5DB;font-size:14px;padding-bottom:8px;">${order.quantity}</td>
            </tr>
          </table>
          <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Reference Files</p>
          <ul style="margin:0 0 24px;padding-left:20px;color:#D1D5DB;font-size:14px;line-height:2;">${fileLinks}</ul>
          <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Contact</p>
          <p style="margin:0 0 4px;color:#D1D5DB;font-size:14px;">${order.name}</p>
          <p style="margin:0 0 4px;"><a href="mailto:${order.email}" style="color:#D97706;">${order.email}</a></p>
          ${order.phone ? `<p style="margin:0 0 4px;color:#D1D5DB;font-size:14px;">${order.phone}</p>` : ''}
          ${order.notes ? `<p style="margin:16px 0 0;color:#9CA3AF;font-size:13px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">${order.notes}</p>` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}
