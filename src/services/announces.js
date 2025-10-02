// Imports
import { ANNOUNCEMENTS_API, ANNOUNCEMENTS_GET_BY_ID_API, EMPLOYEES_API } from "../config/constants.js";
import { getData, postData, putData, deleteData } from "../data/methods.js";
import { showError, showSuccess, showConfirmation } from "../utils/sweetAlert.js";

// ===== FUNCIONES DE SEGURIDAD =====
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
            window.location.href = "../../index.html";
        }
        return true;
    } catch (error) {
        showError("Error cerrando sesión: " + error);
        sessionStorage.removeItem("session");
        window.location.href = "../../index.html";
    }
};

// ===== FUNCIONES CRUD DE ANUNCIOS =====

/**
 * Obtener todos los empleados para el select
 */
const obtainEmployees = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(`${EMPLOYEES_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            const employeeSelect = document.getElementById("employeeId");
            
            if (!employeeSelect) {
                console.error("Elemento select de empleados no encontrado");
                return;
            }

            // Limpiar opciones existentes (excepto la primera)
            employeeSelect.innerHTML = '<option value="" selected disabled>Seleccione un empleado</option>';
            
            // Agregar opciones de empleados
            response.data.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.employeeId;
                option.textContent = employee.name;
                employeeSelect.appendChild(option);
            });

            console.log("Empleados cargados correctamente");

        } else {
            showError(response?.message || "No se pudieron obtener los empleados.");
        }
    } catch (error) {
        console.error("Error obteniendo empleados:", error);
        showError(error.message || "Error al cargar empleados");
    }
};

/**
 * Obtener todos los anuncios y cargar en DataTable
 */
const obtainAnnouncements = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(`${ANNOUNCEMENTS_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            // Inicializar DataTable
            $('#announcementsTable').DataTable({
                destroy: true,
                data: response.data,
                columns: [
                    { data: "announcementId", title: "ID" },
                    { data: "title", title: "Título" },
                    { 
                        data: "content", 
                        title: "Contenido",
                        render: function(data) {
                            return data && data.length > 50 ? 
                                data.substring(0, 50) + '...' : 
                                data || '-';
                        }
                    },
                    { 
                        data: "employeeName", 
                        title: "Empleado",
                        render: function(data) {
                            return data || '-';
                        }
                    },
                    { 
                        data: "publishedDate", 
                        title: "Fecha Publicación",
                        render: function(data) {
                            if (!data) return '-';
                            const date = new Date(data);
                            return date.toLocaleString('es-ES');
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
                                <button onclick='editAnnouncement(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-warning btn-sm mt-2">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button onclick='deleteAnnouncement(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
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
            showError(response?.message || "No se pudieron obtener los anuncios.");
        }
    } catch (error) {
        console.error("Error obteniendo anuncios:", error);
        showError(error.message || "Error al cargar anuncios");
    }
};

/**
 * Formatear fecha para la API (formato ISO 8601 correcto)
 */
const formatDateForAPI = (dateTimeLocal) => {
    // dateTimeLocal viene en formato: "2025-10-02T16:30"
    const date = new Date(dateTimeLocal);
    return date.toISOString(); // Esto produce: "2025-10-02T16:30:00.000Z"
};

/**
 * Crear nuevo anuncio
 */
const createAnnouncement = async () => {
    try {
        if (!validateSession()) return;

        const title = document.getElementById("title").value;
        const content = document.getElementById("content").value;
        const employeeId = document.getElementById("employeeId").value;
        const publishedDate = document.getElementById("publishedDate").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!title || !content || !employeeId || !publishedDate) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar fecha (no puede ser pasada para anuncios futuros)
        const selectedDate = new Date(publishedDate);
        const now = new Date();
        if (selectedDate < now) {
            showError("La fecha de publicación no puede ser en el pasado.");
            return;
        }

        const announcementData = {
            AnnouncementId: 0, // Para crear nuevo
            EmployeeId: parseInt(employeeId),
            Title: title.trim(),
            Content: content.trim(),
            PublishedDate: formatDateForAPI(publishedDate), // Formato ISO correcto
            IsActive: isActive,
            Message: null,
            Success: 0,
            EmployeeName: "" // Se llenará en el backend
        };

        console.log("Datos enviados:", announcementData);

        const response = await postData(ANNOUNCEMENTS_API, announcementData);

        if (response && response.success !== false) {
            showSuccess("Anuncio creado correctamente");
            await obtainAnnouncements();
            clearAnnouncementForm();
        } else {
            showError(response?.message || "Error al crear anuncio");
        }
    } catch (error) {
        console.error("Error creando anuncio:", error);
        showError(error.message || "Error al crear anuncio");
    }
};

/**
 * Editar anuncio - llenar formulario con datos existentes
 */
const editAnnouncement = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos del anuncio
        document.getElementById("announcementId").value = row.announcementId;
        document.getElementById("title").value = row.title || '';
        document.getElementById("content").value = row.content || '';
        document.getElementById("employeeId").value = row.employeeId || '';
        
        // Formatear fecha para el input datetime-local
        if (row.publishedDate) {
            const date = new Date(row.publishedDate);
            // Ajustar por la zona horaria local
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            const formattedDate = date.toISOString().slice(0, 16);
            document.getElementById("publishedDate").value = formattedDate;
        }
        
        document.getElementById("isActive").checked = row.isActive || false;

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Anuncio";

        // Scroll al formulario
        document.getElementById('announcementForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error editando anuncio:", error);
        showError("Error al cargar datos del anuncio");
    }
};

/**
 * Actualizar anuncio existente
 */
const updateAnnouncement = async () => {
    try {
        if (!validateSession()) return;

        const announcementId = document.getElementById("announcementId").value;
        const title = document.getElementById("title").value;
        const content = document.getElementById("content").value;
        const employeeId = document.getElementById("employeeId").value;
        const publishedDate = document.getElementById("publishedDate").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!announcementId) {
            showError("ID de anuncio no válido");
            return;
        }

        if (!title || !content || !employeeId || !publishedDate) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar fecha (no puede ser pasada para anuncios futuros)
        const selectedDate = new Date(publishedDate);
        const now = new Date();
        if (selectedDate < now) {
            showError("La fecha de publicación no puede ser en el pasado.");
            return;
        }

        const announcementData = {
            AnnouncementId: parseInt(announcementId),
            EmployeeId: parseInt(employeeId),
            Title: title.trim(),
            Content: content.trim(),
            PublishedDate: formatDateForAPI(publishedDate), // Formato ISO correcto
            IsActive: isActive,
            Message: null,
            Success: 0,
            EmployeeName: "" // Se llenará en el backend
        };

        console.log("Datos enviados para actualizar:", announcementData);

        const response = await putData(ANNOUNCEMENTS_API, announcementData);

        if (response && response.success !== false) {
            showSuccess("Anuncio actualizado correctamente");
            await obtainAnnouncements();
            clearAnnouncementForm();
        } else {
            showError(response?.message || "Error al actualizar anuncio");
        }
    } catch (error) {
        console.error("Error actualizando anuncio:", error);
        showError(error.message || "Error al actualizar anuncio");
    }
};

/**
 * Eliminar anuncio con confirmación (eliminación lógica)
 */
const deleteAnnouncement = async (row) => {
    try {
        if (!validateSession()) return;

        const announcementId = row.announcementId;
        const announcementTitle = row.title;

        if (!announcementId) {
            showError("ID de anuncio no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar el anuncio "${announcementTitle}"?, Esta acción desactivará el anuncio del sistema.`,
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        // Para DELETE, enviar los datos completos del anuncio
        const announcementData = {
            AnnouncementId: parseInt(announcementId),
            EmployeeId: row.employeeId,
            Title: row.title,
            Content: row.content,
            PublishedDate: row.publishedDate,
            IsActive: false, // Desactivar en lugar de eliminar
            Message: null,
            Success: 0,
            EmployeeName: row.employeeName
        };

        const response = await deleteData(ANNOUNCEMENTS_GET_BY_ID_API(announcementId), announcementData);

        if (response === null || response?.success !== false) {
            showSuccess("Anuncio eliminado correctamente");
            await obtainAnnouncements();
        } else {
            showError(response?.message || "Error al eliminar anuncio");
        }
    } catch (error) {
        console.error("Error eliminando anuncio:", error);
        showError(error.message || "Error al eliminar anuncio");
    }
};

/**
 * Limpiar formulario de anuncio
 */
const clearAnnouncementForm = () => {
    document.getElementById("announcementForm").reset();
    document.getElementById("announcementId").value = "";
    
    // Establecer fecha y hora actual por defecto
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("publishedDate").value = now.toISOString().slice(0, 16);
    
    document.getElementById("isActive").checked = true;
    document.getElementById("submitBtn").textContent = "Guardar Anuncio";
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editAnnouncement = editAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    validateSession();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const announcementForm = document.getElementById("announcementForm");
    if (announcementForm) {
        announcementForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const announcementId = document.getElementById("announcementId").value;
            
            if (announcementId) {
                await updateAnnouncement();
            } else {
                await createAnnouncement();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearAnnouncementForm);
    }

    // Establecer fecha y hora actual por defecto
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("publishedDate").value = now.toISOString().slice(0, 16);

    // Cargar datos iniciales
    await obtainAnnouncements();
    await obtainEmployees();
});