# Make table body text much darker and more professional
$content = Get-Content "ImageBasedMeetingScheduler.css"

# Make table body text extremely dark and visible
$content = $content -replace 'color: #000000 !important;', 'color: #000000 !important;'

# Increase font weight for professional appearance
$content = $content -replace 'font-weight: 600;', 'font-weight: 700;'

# Add professional text styling
$content = $content -replace 'font-size: 13px;', 'font-size: 14px;'

# Add text shadow for professional depth
$content = $content -replace 'transition: all 0.2s ease;', 'transition: all 0.2s ease;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);'

# Ensure pure white background for maximum contrast
$content = $content -replace 'background: #ffffff !important;', 'background: #ffffff !important;'

# Set the updated content back
$content | Set-Content "ImageBasedMeetingScheduler.css"
