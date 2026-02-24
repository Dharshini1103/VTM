# Maximum visibility fix - make table text always visible
$content = Get-Content "ImageBasedMeetingScheduler.css"

# Make table text much darker for maximum visibility
$content = $content -replace 'color: #1f2937 !important;', 'color: #000000 !important;'

# Increase font weight for better visibility
$content = $content -replace 'font-weight: 500;', 'font-weight: 600;'

# Ensure pure white background for contrast
$content = $content -replace 'background: #ffffff !important;', 'background: #ffffff !important;'

# Add text shadow for better visibility
$content = $content -replace 'transition: all 0.2s ease;', 'transition: all 0.2s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);'

# Set the updated content back
$content | Set-Content "ImageBasedMeetingScheduler.css"
