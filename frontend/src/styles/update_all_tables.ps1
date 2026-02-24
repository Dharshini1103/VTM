# Update all table styling to match the image design
$content = Get-Content "ImageBasedMeetingScheduler.css"

# Update table headers
$content = $content -replace 'color: #0f172a !important;', 'color: #1f2937 !important;'
$content = $content -replace 'font-weight: 800 !important;', 'font-weight: 600 !important;'

# Update table body
$content = $content -replace 'color: #000000 !important;', 'color: #4b5563 !important;'
$content = $content -replace 'font-weight: 700;', 'font-weight: 400;'
$content = $content -replace 'font-weight: 500;', 'font-weight: 400;'

# Update table hover states
$content = $content -replace 'color: #1f2937 !important;', 'color: #1f2937 !important;'
$content = $content -replace 'background: #f1f5f9 !important;', 'background: #f8fafc !important;'

# Update font sizes
$content = $content -replace 'font-size: 14px;', 'font-size: 13px;'
$content = $content -replace 'font-size: 13px;', 'font-size: 13px;'

# Update padding
$content = $content -replace 'padding: 20px 16px;', 'padding: 12px 16px;'
$content = $content -replace 'padding: 16px 12px;', 'padding: 12px 16px;'

# Update borders
$content = $content -replace 'border-bottom: 1px solid #f3f4f6;', 'border-bottom: 1px solid #e5e7eb;'
$content = $content -replace 'border-bottom: 1px solid #e5e7eb;', 'border-bottom: 1px solid #e5e7eb;'

# Set the updated content back
$content | Set-Content "ImageBasedMeetingScheduler.css"
