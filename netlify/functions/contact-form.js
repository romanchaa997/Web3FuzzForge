// Netlify function to handle contact form submissions
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" })
    };
  }

  try {
    // Parse the form data
    const payload = JSON.parse(event.body);
    const { name, email, message } = payload;
    
    // Validate form inputs
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" })
      };
    }
    
    // Here you would typically integrate with an email service
    // For example, using SendGrid, Mailgun, or similar
    // For demonstration, we'll just log the submission
    console.log("Form submission received:", { name, email, message });
    
    // In a real implementation, you would add code like:
    // await sendEmailNotification(name, email, message);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Form submission successful",
        success: true
      })
    };
  } catch (error) {
    console.error("Form submission error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: "Internal server error",
        error: error.message
      })
    };
  }
}; 