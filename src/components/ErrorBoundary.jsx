import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log error to backend (optional)
    if (typeof window !== "undefined" && navigator.onLine) {
      try {
        fetch("/api/error-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.toString(),
            stack: error.stack,
            component: this.props.componentName || "Unknown",
            timestamp: new Date().toISOString()
          })
        }).catch(() => {
          // Silently fail - don't crash if error logging fails
        });
      } catch (e) {
        // Ignore logging errors
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "40px 20px",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--red-50)"
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              backgroundColor: "var(--white)",
              padding: "40px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px var(--black-10)",
              textAlign: "center"
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <AlertTriangle size={48} style={{ color: "var(--red)", margin: "0 auto" }} />
            </div>

            <h1
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "var(--gray-900)",
                marginBottom: "12px"
              }}
            >
              Oops! Something went wrong
            </h1>

            <p
              style={{
                fontSize: "14px",
                color: "var(--gray-500)",
                marginBottom: "20px",
                lineHeight: "1.6"
              }}
            >
              We encountered an unexpected error. Your data is safe. Please try recovering below.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div
                style={{
                  backgroundColor: "var(--gray-50)",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "var(--gray-700)",
                  fontFamily: "monospace",
                  overflow: "auto",
                  maxHeight: "150px",
                  border: "1px solid var(--gray-100)"
                }}
              >
                <strong>Error Details:</strong>
                <pre
                  style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
                flexWrap: "wrap",
                justifyContent: "center"
              }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "var(--blue)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px"
                }}
              >
                <RotateCcw size={16} />
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "var(--gray-700)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "var(--green-500)",
                  color: "var(--white)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px"
                }}
              >
                <Home size={16} />
                Go Home
              </button>
            </div>

            {this.state.errorCount > 2 && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px",
                  backgroundColor: "var(--yellow-50)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--amber-700)",
                  border: "1px solid var(--amber)"
                }}
              >
                Multiple errors detected. Try reloading the page. If problems persist, clear your
                browser cache.
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
