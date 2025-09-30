//Imports

const validateSession = () => {
    try {
        const sessionStatus = sessionStorage.getItem("session");
        const isValid = sessionStatus === "ok";
        if (!isValid) {
            sessionStorage.removeItem("session");
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
            window.location.href = "../../index.html";
        }
        return true;
    } catch (error) {
        showError(error);
        sessionStorage.removeItem("session");
        window.location.href = "../../index.html";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    validateSession();
    
    // Event listener directo para cerrar sesión
    const closeSessionBtn = document.getElementById('closeSession');
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener('click', closeSession);
    }
});