import server from '../environment';

const API_BASE_URL = `${server}/api/v1/meetings`;

const getToken = () => localStorage.getItem('token');

export const scheduleMeetingRequest = async (meetingCode, scheduledFor = null) => {
    const token = getToken();
    if (!token) {
        throw new Error('You must be logged in to schedule a meeting');
    }

    const response = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token,
            meetingCode,
            scheduledFor
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to schedule meeting');
    }

    return response.json();
};

export const fetchPendingMeetings = async () => {
    const token = getToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const url = new URL(`${API_BASE_URL}/pending`);
    url.searchParams.append('token', token);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to load meetings');
    }

    return response.json();
};

export const acceptMeetingRequest = async (meetingId) => {
    const token = getToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/${meetingId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to accept meeting');
    }

    return response.json();
};

