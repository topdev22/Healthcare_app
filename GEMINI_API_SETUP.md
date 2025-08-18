# Gemini API Setup for Food Image Analysis

This document explains how to set up Google's Gemini API for food image analysis in the Health Buddy app.

## Prerequisites

1. Google Cloud Project with Gemini API enabled
2. Gemini API key

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Configure Environment Variables

Create a `.env` file in the project root (if it doesn't exist) and add:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Other existing environment variables...
MONGODB_URI=mongodb://localhost:27017/health-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Install Dependencies

The required package has already been installed:

```bash
npm install @google/generative-ai
```

## How It Works

### Frontend (FoodAnalysisModal.tsx)
1. User selects or captures a food image
2. Image is sent to the backend via FormData
3. Backend processes the image with Gemini API
4. Results are returned and displayed to the user

### Backend (server/services/geminiService.ts)
1. Dedicated service class for Gemini API integration
2. Handles image processing and API communication
3. Provides fallback data when API is unavailable
4. Includes comprehensive error handling and validation
5. Configurable parameters for different use cases

### Backend (server/routes/health.ts)
1. Receives image file via multer middleware
2. Uses GeminiService for food analysis
3. Handles API responses and fallback scenarios
4. Returns structured food analysis results

### API Endpoints

#### Food Analysis
- **POST** `/health/analyze-food`
- **Authentication**: Required (Bearer token)
- **Content-Type**: `multipart/form-data`
- **Body**: `image` field containing the image file

#### Service Status
- **GET** `/health/gemini-status`
- **Authentication**: Required (Bearer token)
- **Response**: Service configuration status

## Response Format

```json
{
  "success": true,
  "message": "Food analysis completed successfully",
  "data": {
    "foodItems": [
      {
        "name": "ご飯",
        "calories": 268,
        "confidence": 0.95,
        "nutrition": {
          "carbs": 58,
          "fiber": 0.6,
          "sugars": 0.1,
          "protein": 5,
          "fat": 0.5
        }
      }
    ],
    "totalCalories": 268,
    "imageUrl": "data:image/jpeg;base64,..."
  }
}
```

## Error Handling

The system includes robust fallback mechanisms:
1. **Service Configuration Check**: If Gemini API is not configured, it uses fallback data
2. **API Failure Handling**: If API call fails, it falls back to mock data
3. **Response Validation**: If JSON parsing fails, it uses fallback data
4. **Graceful Degradation**: The system continues to work even without the API

## Service Architecture

### GeminiService Class
- **Configuration Management**: Handles API key validation and client initialization
- **Image Processing**: Converts and prepares images for API calls
- **Response Parsing**: Safely parses and validates API responses
- **Fallback System**: Provides reliable fallback data when needed
- **Error Handling**: Comprehensive error handling with detailed logging

## Testing

1. Start the development server: `npm run dev:full`
2. Open the app and navigate to the food tracking feature
3. Take or upload a food image
4. The system should analyze the image and return results

## Troubleshooting

### Common Issues

1. **"Gemini API key not configured"**
   - Make sure `GEMINI_API_KEY` is set in your `.env` file
   - Restart the server after adding the environment variable

2. **"Invalid response format from Gemini API"**
   - The API might return non-JSON format
   - Check the server logs for the actual response
   - The system will fall back to mock data

3. **Image upload fails**
   - Check file size (max 10MB)
   - Ensure image format is supported (JPEG, PNG, GIF, WebP)
   - Verify multer configuration

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed logs including the Gemini API response.

## Security Considerations

1. **API Key Security**: Never commit your API key to version control
2. **Image Processing**: Images are processed in memory and not stored permanently
3. **Rate Limiting**: Consider implementing rate limiting for the API endpoint
4. **Input Validation**: The system validates image files before processing

## Cost Considerations

- Gemini API has usage-based pricing
- Monitor your API usage in Google Cloud Console
- Consider implementing caching for repeated images
- Set up billing alerts to avoid unexpected charges
