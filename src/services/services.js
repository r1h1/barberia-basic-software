// Imports
import { SERVICES_API, SERVICES_GET_BY_ID_API } from "../config/constants.js";
import { getData, postData, putData, deleteData } from "../data/methods.js";
import { showError, showSuccess, showConfirmation } from "../utils/sweetAlert.js";
import { initializeDynamicMenu } from '../config/menu.js';

// ===== FUNCIONES DE SEGURIDAD =====
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
        showError("Error validando sesión: " + error);
        return false;
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
        showError("Error cerrando sesión: " + error);
        sessionStorage.removeItem("session");
        sessionStorage.removeItem("sessionData");
        window.location.href = "../../index.html";
    }
};

// ===== FUNCIONES CRUD DE SERVICIOS =====

/**
 * Obtener todos los servicios y cargar en DataTable
 */
const obtainServices = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(`${SERVICES_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            // Inicializar DataTable
            $('#servicesTable').DataTable({
                destroy: true,
                data: response.data,
                columns: [
                    { data: "serviceId", title: "ID" },
                    { data: "name", title: "Nombre" },
                    { 
                        data: "description", 
                        title: "Descripción",
                        render: function(data) {
                            return data && data.length > 50 ? 
                                data.substring(0, 50) + '...' : 
                                data || '-';
                        }
                    },
                    { 
                        data: "basePrice", 
                        title: "Precio",
                        render: function(data) {
                            return data ? `Q${parseFloat(data).toFixed(2)}` : 'Q0.00';
                        }
                    },
                    { 
                        data: "durationMin", 
                        title: "Duración",
                        render: function(data) {
                            return data ? `${data} min` : '-';
                        }
                    },
                    { 
                        data: "isActive", 
                        title: "Estado",
                        render: function(data) {
                            return data ? 
                                '<span class="badge bg-success">Activo</span>' : 
                                '<span class="badge bg-secondary">Inactivo</span>';
                        }
                    },
                    {
                        data: null,
                        title: "Acciones",
                        render: function (data, type, row) {
                            return `
                                <button onclick='editService(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-warning btn-sm mt-2">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button onclick='deleteService(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-danger btn-sm mt-2">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            `;
                        }
                    }
                ],
                dom: 'Bfrtip',
                buttons: [
                    {
                        extend: 'copy',
                        className: 'btn btn-secondary'
                    },
                    {
                        extend: 'excel',
                        className: 'btn btn-secondary'
                    },
                    {
                        extend: 'pdf',
                        className: 'btn btn-secondary'
                    },
                    {
                        extend: 'print',
                        className: 'btn btn-secondary'
                    }
                ],
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
                },
                pageLength: 10,
                responsive: true,
                order: [[0, 'desc']]
            });
        } else {
            showError(response?.message || "No se pudieron obtener los servicios.");
        }
    } catch (error) {
        console.error("Error obteniendo servicios:", error);
        showError(error.message || "Error al cargar servicios");
    }
};

/**
 * Crear nuevo servicio
 */
const createService = async () => {
    try {
        if (!validateSession()) return;

        const name = document.getElementById("name").value;
        const description = document.getElementById("description").value;
        const basePrice = document.getElementById("basePrice").value;
        const durationMin = document.getElementById("durationMin").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!name || !description || !basePrice || !durationMin) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar precio
        const price = parseFloat(basePrice);
        if (price < 0) {
            showError("El precio no puede ser negativo.");
            return;
        }

        // Validar duración
        const duration = parseInt(durationMin);
        if (duration <= 0) {
            showError("La duración debe ser mayor a 0 minutos.");
            return;
        }

        const serviceData = {
            serviceId: 0, // Para crear nuevo
            name: name.trim(),
            description: description.trim(),
            basePrice: price,
            durationMin: duration,
            isActive: isActive,
            success: true,
            message: null
        };

        const response = await postData(SERVICES_API, serviceData);

        if (response && response.success !== false) {
            showSuccess("Servicio creado correctamente");
            await obtainServices();
            clearServiceForm();
        } else {
            showError(response?.message || "Error al crear servicio");
        }
    } catch (error) {
        console.error("Error creando servicio:", error);
        showError(error.message || "Error al crear servicio");
    }
};

/**
 * Editar servicio - llenar formulario con datos existentes
 */
const editService = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos del servicio
        document.getElementById("serviceId").value = row.serviceId;
        document.getElementById("name").value = row.name || '';
        document.getElementById("description").value = row.description || '';
        document.getElementById("basePrice").value = row.basePrice || '';
        document.getElementById("durationMin").value = row.durationMin || '';
        document.getElementById("isActive").checked = row.isActive || false;

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Servicio";

        // Scroll al formulario
        document.getElementById('serviceForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error editando servicio:", error);
        showError("Error al cargar datos del servicio");
    }
};

/**
 * Actualizar servicio existente
 */
const updateService = async () => {
    try {
        if (!validateSession()) return;

        const serviceId = document.getElementById("serviceId").value;
        const name = document.getElementById("name").value;
        const description = document.getElementById("description").value;
        const basePrice = document.getElementById("basePrice").value;
        const durationMin = document.getElementById("durationMin").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!serviceId) {
            showError("ID de servicio no válido");
            return;
        }

        if (!name || !description || !basePrice || !durationMin) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar precio
        const price = parseFloat(basePrice);
        if (price < 0) {
            showError("El precio no puede ser negativo.");
            return;
        }

        // Validar duración
        const duration = parseInt(durationMin);
        if (duration <= 0) {
            showError("La duración debe ser mayor a 0 minutos.");
            return;
        }

        const serviceData = {
            serviceId: parseInt(serviceId),
            name: name.trim(),
            description: description.trim(),
            basePrice: price,
            durationMin: duration,
            isActive: isActive,
            success: true,
            message: null
        };

        const response = await putData(SERVICES_API, serviceData);

        if (response && response.success !== false) {
            showSuccess("Servicio actualizado correctamente");
            await obtainServices();
            clearServiceForm();
        } else {
            showError(response?.message || "Error al actualizar servicio");
        }
    } catch (error) {
        console.error("Error actualizando servicio:", error);
        showError(error.message || "Error al actualizar servicio");
    }
};

/**
 * Eliminar servicio con confirmación (eliminación lógica)
 */
const deleteService = async (row) => {
    try {
        if (!validateSession()) return;

        const serviceId = row.serviceId;
        const serviceName = row.name;

        if (!serviceId) {
            showError("ID de servicio no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar el servicio "${serviceName}"? Esta acción desactivará el servicio del sistema.`,
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        // Para DELETE, enviar los datos completos del servicio
        const serviceData = {
            serviceId: parseInt(serviceId),
            name: row.name,
            description: row.description,
            basePrice: row.basePrice,
            durationMin: row.durationMin,
            isActive: false, // Desactivar en lugar de eliminar
            success: true,
            message: null
        };

        const response = await deleteData(SERVICES_GET_BY_ID_API(serviceId), serviceData);

        if (response === null || response?.success !== false) {
            showSuccess("Servicio eliminado correctamente");
            await obtainServices();
        } else {
            showError(response?.message || "Error al eliminar servicio");
        }
    } catch (error) {
        console.error("Error eliminando servicio:", error);
        showError(error.message || "Error al eliminar servicio");
    }
};

/**
 * Limpiar formulario de servicio
 */
const clearServiceForm = () => {
    document.getElementById("serviceForm").reset();
    document.getElementById("serviceId").value = "";
    document.getElementById("isActive").checked = true;
    document.getElementById("submitBtn").textContent = "Guardar Servicio";
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editService = editService;
window.deleteService = deleteService;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    validateSession();
    initializeDynamicMenu();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const serviceForm = document.getElementById("serviceForm");
    if (serviceForm) {
        serviceForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const serviceId = document.getElementById("serviceId").value;
            
            if (serviceId) {
                await updateService();
            } else {
                await createService();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearServiceForm);
    }

    // Cargar datos iniciales
    await obtainServices();
});