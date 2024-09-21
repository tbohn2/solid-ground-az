class AuthService {
    getProfile() {
        return jwtDecode(this.getToken());
    }

    loggedIn() {
        const token = this.getToken();
        return token && !this.isTokenExpired(token) ? true : false;
    }

    isTokenExpired(token) {
        const decoded = jwtDecode(token);
        if (decoded.exp < Date.now() / 1000) {
            localStorage.removeItem('id_token');
            localStorage.removeItem('services');
            localStorage.removeItem('admin_id');
            return true;
        }
        return false;
    }

    getToken() {
        return localStorage.getItem('id_token');
    }

    getServices = async () => {
        const token = this.getToken();
        try {
            const cachedServices = localStorage.getItem('services');
            if (cachedServices) {
                return JSON.parse(cachedServices);
            }

            const adminId = localStorage.getItem('admin_id');
            const response = await fetch(`https://solidgroundaz.com/${adminId}/allServices`, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
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

    login(data) {
        localStorage.setItem('id_token', data.token);
        localStorage.setItem('admin_id', data.id);
    }

    logout() {
        localStorage.removeItem('id_token');
        localStorage.removeItem('services');
        localStorage.removeItem('admin_id');
        window.location.assign('/admin/login');
    }
}

const auth = new AuthService();

export default auth;