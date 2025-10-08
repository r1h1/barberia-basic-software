import { AUTH_LOGIN_API } from "../config/constants.js";
import { postData } from "../data/methods.js";
import { showError, showSuccess } from "../utils/sweetAlert.js";

const loginAuth = async (event) => {
    event.preventDefault();
    
    try {
        const user = document.getElementById("user").value.trim();
        const password = document.getElementById("password").value;
        
        // Validación básica
        if (!user || !password) {
            showError("Por favor, completa todos los campos");
            return;
        }

        const credentials = {
            login: user,
            password: password
        };

        const response = await postData(AUTH_LOGIN_API, credentials);
        
        if (response && response.success !== false) {

            sessionStorage.setItem("session", "ok");
            sessionStorage.setItem("sessionData", JSON.stringify(response.data));
            
            // Cerrar el modal después de login exitoso
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) {
                loginModal.hide();
            }

            location.href = "src/views/dashboard.html";
            
        } else {
            showError(response?.message || "Credenciales incorrectas");
        }
        
    } catch (error) {
        console.error("Login error:", error);
        showError(error);
    }
}

// Agregar listeners
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginAuth);
    }
});