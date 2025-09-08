# Survey Insights Dashboard

## Overview
The Survey Insights Dashboard provides comprehensive analytics and visualizations for employee engagement survey results. It's designed to match the concepts from the original Jupyter notebook analysis while maintaining the iScore application's design system.

## Features

### Key Metrics Cards
- **Total Responses**: Shows the total number of survey participants
- **Engagement Score**: Percentage of positive responses on role clarity
- **Satisfaction Rate**: Percentage of positive collaboration ratings
- **Growth Opportunities**: Percentage of positive career growth responses

### Visualizations

1. **Role & Responsibility Clarity** (Bar Chart)
   - Shows distribution of responses to role clarity question
   - Helps identify if employees understand their responsibilities

2. **Collaboration & Teamwork** (Pie Chart)
   - Visual breakdown of teamwork rating responses
   - Highlights collaboration strengths and areas for improvement

3. **Manager Support** (Bar Chart)
   - Distribution of feedback on manager support and professional growth
   - Key indicator of management effectiveness

4. **Leadership Trust** (Bar Chart)
   - Shows employee trust levels in leadership decisions
   - Critical for organizational health

5. **Career Growth Opportunities** (Bar Chart)
   - Employee perceptions of career advancement possibilities
   - Important for retention and satisfaction

6. **Preferred Development Opportunities** (Pie Chart)
   - Shows which development opportunities employees value most
   - Guides training and development investments

7. **Work Motivation & Engagement** (Horizontal Bar Chart)
   - Daily work motivation and engagement levels
   - Includes chip indicators for quick insights

8. **Leadership Qualities Priority Ranking** (Custom Grid)
   - Shows how employees rank different leadership qualities
   - Helps identify leadership development priorities

### Key Insights Section
- **Strengths**: Highlights positive survey findings
- **Areas for Improvement**: Identifies focus areas for HR initiatives

## Design System
- Uses iScore brand colors: Primary Purple (#5A2D82), Secondary Teal (#00B59D)
- Material-UI components for consistency
- Responsive design with Grid layout
- Custom styled charts using Recharts library

## Data Structure
The component uses hardcoded survey data based on the provided CSV file. In a production environment, this would be replaced with API calls to fetch real survey results.

## Usage
The dashboard is integrated into the HR Management Dashboard under the "Analytics" tab. HR users can view comprehensive survey insights to make data-driven decisions about employee engagement initiatives.

## Future Enhancements
- Real-time data integration with backend APIs
- Filtering by department, date range, or employee demographics
- Export functionality for reports
- Interactive drill-down capabilities
- Trend analysis over time
