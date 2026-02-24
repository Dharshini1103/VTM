# Final uniform table styling - make all tables identical
$content = Get-Content "ImageBasedMeetingScheduler.css"

# Replace all table header styling with uniform design
$content = $content -replace '\.ant-table-thead[^}]*\}', '.ant-table-thead > tr > th {
  background: #ffffff !important;
  border-bottom: 2px solid #e5e7eb;
  color: #1f2937 !important;
  font-weight: 600 !important;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 16px;
}'

# Replace all table body styling with uniform design
$content = $content -replace '\.ant-table-tbody[^}]*\}', '.ant-table-tbody > tr > td {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
  color: #4b5563 !important;
  font-weight: 400;
  font-size: 13px;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  background: #ffffff !important;
  transition: all 0.2s ease;
}'

# Update hover states to be uniform
$content = $content -replace '\.ant-table-tbody[^{]*\{[^}]*hover[^}]*\}', '.ant-table-tbody > tr:hover {
  background: #f8fafc !important;
}

.ant-table-tbody > tr:hover > td {
  color: #1f2937 !important;
  background: #f8fafc !important;
}'

# Set the updated content back
$content | Set-Content "ImageBasedMeetingScheduler.css"
