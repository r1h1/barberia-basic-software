// Función genérica para mostrar alertas
function showAlert({title = "Mensaje", text = "", icon = "info", confirmButtonText = "OK"}) {
    return Swal.fire({
        title,
        text,
        icon,
        confirmButtonText
    });
}

// Función para mostrar alerta de éxito
function showSuccess(message = "Operación realizada con éxito") {
    return Swal.fire({
        title: "¡Éxito!",
        text: message,
        icon: "success",
        confirmButtonText: "OK"
    });
}

// Función para mostrar alerta de error
function showError(message) {
    return Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
        confirmButtonText: "Entendido"
    });
}

// Función para confirmar antes de una acción
async function showConfirmation(message = "¿Estás seguro?", confirmButtonText = "Sí", cancelButtonText = "No") {
    const result = await Swal.fire({
        title: "Confirmación",
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText
    });

    return result.isConfirmed;
}

// Exportar funciones para usarlas en otros archivos
export {showAlert, showSuccess, showError, showConfirmation};