class AuthService {
    loggedIn() {
        return localStorage.getItem('loggedIn') === 'true';
    }

    getServices = async () => {
        try {
            const cachedServices = localStorage.getItem('services');
            if (cachedServices) {
                return JSON.parse(cachedServices);
            }

            const adminId = localStorage.getItem('admin_id');
            const response = await fetch(`/api/${adminId}/allServices`, { headers: { 'Content-Type': 'application/json' } });
            if (response.ok) {
                const services = await response.json();
                localStorage.setItem('services', JSON.stringify(services));
                return services;
            } else {
                console.error('Server request failed');
                return ('Server request failed to retrieve services. Please try again later.');
            }
        } catch (error) {
            console.error('Server request failed');
            return ('Server request failed to retrieve services. Please try again later.');
        }
    };

    logout() {
        localStorage.clear();
        window.location.assign('/admin/login');
    }
}

const auth = new AuthService();

export default auth;