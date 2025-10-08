// Imports
import { ANNOUNCEMENTS_API } from "../config/constants.js";
import { getData } from "../data/methods.js";
import { showError } from "../utils/sweetAlert.js";
import { initializeDynamicMenu } from '../config/menu.js';

const validateSession = () => {
    try {
        const sessionStatus = sessionStorage.getItem("session");
        const isValid = sessionStatus === "ok";
        if (!isValid) {
            sessionStorage.removeItem("session");
            sessionStorage.removeItem("sessionData");
            window.location.href = "../../index.html";
            return false;
        }
        return true;
    } catch (error) {
        showError(error);
    }
};

const closeSession = () => {
    try {
        const sessionStatus = sessionStorage.getItem("session");
        const isValid = sessionStatus === "ok";
        if (isValid) {
            sessionStorage.removeItem("session");
            sessionStorage.removeItem("sessionData");
            window.location.href = "../../index.html";
        }
        return true;
    } catch (error) {
        showError(error);
        sessionStorage.removeItem("session");
        sessionStorage.removeItem("sessionData");
        window.location.href = "../../index.html";
    }
}

const getAnnounces = async () => {
    try {
        const response = await getData(ANNOUNCEMENTS_API);
        if (response && response.success !== false && response.data.length > 0) {

            const dataHtml = response.data.map(anuncio => `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="announcement-card">
                        <div class="announcement-header">
                            <h5 class="mb-2">${anuncio.title || 'Sin título'}</h5>
                            <p class="mb-0">
                                <small><i class="bi bi-clock me-1"></i>
                                Publicado: ${anuncio.publishedDate}
                                </small>
                            </p>
                        </div>
                        <div class="announcement-content">
                            <p class="card-text">${anuncio.content || 'Sin contenido'}</p>
                            <div class="announcement-meta">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span><i class="bi bi-person me-1"></i>${anuncio.employeeName || 'Anónimo'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            document.getElementById("announcementsGrid").innerHTML = dataHtml;

            // Ocultar estado vacío si hay anuncios
            document.getElementById("emptyState").classList.add('d-none');

        } else {
            // Mostrar estado vacío
            document.getElementById("announcementsGrid").innerHTML = '';
            document.getElementById("emptyState").classList.remove('d-none');
        }
    } catch (error) {
        console.error("Error:", error);
        showError(error.message || "Error al cargar anuncios");
    }
}


document.addEventListener('DOMContentLoaded', function () {
    validateSession();
    getAnnounces();
    initializeDynamicMenu();
    
    // Event listener directo para cerrar sesión
    const closeSessionBtn = document.getElementById('closeSession');
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener('click', closeSession);
    }
});