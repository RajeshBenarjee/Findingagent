const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function getRecommendations(studentProfile) {
  const response = await fetch(`${API_BASE_URL}/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentProfile),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch recommendations from server.');
  }

  return response.json();
}

export async function parseResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/parse-resume`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to parse resume PDF.');
  }

  return response.json();
}

export async function sendEmailAlert(emailPayload) {
  const response = await fetch(`${API_BASE_URL}/alert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to trigger email alert.');
  }

  return response.json();
}
