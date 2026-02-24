# Create uniform table styling matching the image design
$content = Get-Content "ImageBasedMeetingScheduler.css"

# Remove all existing table color rules and replace with uniform styling
$content = $content -replace 'color: #[0-9a-fA-F]{3,6} !important;', 'color: #4b5563 !important;'

# Set uniform font weights
$content = $content -replace 'font-weight: [0-9]+;', 'font-weight: 400;'

# Set uniform font sizes
$content = $content -replace 'font-size: [0-9]+px;', 'font-size: 13px;'

# Set uniform padding
$content = $content -replace 'padding: [0-9]+px [0-9]+px;', 'padding: 12px 16px;'

# Set uniform borders
$content = $content -replace 'border-bottom: 1px solid #[0-9a-fA-F]{3,6};', 'border-bottom: 1px solid #e5e7eb;'

# Update table headers specifically
$content = $content -replace '\.ant-table-thead[^{]*\{[^}]*\}', '.ant-table-thead > tr > th {
  background: #ffffff !important;
  border-bottom: 2px solid #e5e7eb;
  color: #1f2937 !important;
  font-weight: 600 !important;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 16px;
}'

# Update table body specifically
$content = $content -replace '\.ant-table-tbody[^{]*\{[^}]*\}', '.ant-table-tbody > tr > td {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
  color: #4b5563 !important;
  font-weight: 400;
  font-size: 13px;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  background: #ffffff !important;
  transition: all 0.2s ease;
}'

# Set the updated content back
$content | Set-Content "ImageBasedMeetingScheduler.css"
