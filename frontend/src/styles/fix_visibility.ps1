# Fix table text visibility - make text always visible
$content = Get-Content "ImageBasedMeetingScheduler.css"

# Make table text darker and more visible
$content = $content -replace 'color: #4b5563 !important;', 'color: #1f2937 !important;'

# Ensure table body has proper contrast
$content = $content -replace 'background: #ffffff !important;', 'background: #ffffff !important;'

# Add higher contrast for better visibility
$content = $content -replace 'font-weight: 400;', 'font-weight: 500;'

# Set the updated content back
$content | Set-Content "ImageBasedMeetingScheduler.css"
