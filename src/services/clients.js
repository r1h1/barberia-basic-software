// Imports
import { CLIENTS_API, CLIENTS_GET_BY_ID_API } from "../config/constants.js";
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

// ===== FUNCIONES CRUD DE CLIENTES =====

/**
 * Obtener todos los clientes y cargar en DataTable
 */
const obtainClients = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(`${CLIENTS_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            // Inicializar DataTable
            $('#clientsTable').DataTable({
                destroy: true,
                data: response.data,
                columns: [
                    { data: "clientId", title: "ID" },
                    { data: "name", title: "Nombre" },
                    { data: "phone", title: "Teléfono" },
                    { data: "email", title: "Email" },
                    { 
                        data: "gender", 
                        title: "Género",
                        render: function(data) {
                            const genderIcons = {
                                'Masculino': '<i class="bi bi-gender-male text-primary"></i> Masculino',
                                'Femenino': '<i class="bi bi-gender-female text-danger"></i> Femenino',
                                'Otro': '<i class="bi bi-gender-ambiguous text-success"></i> Otro',
                                'Prefiero no decir': '<i class="bi bi-dash-circle text-secondary"></i> Prefiero no decir'
                            };
                            return genderIcons[data] || data;
                        }
                    },
                    { 
                        data: "registrationDate", 
                        title: "Fecha Registro",
                        render: function(data) {
                            if (!data) return '-';
                            const date = new Date(data);
                            return date.toLocaleDateString('es-ES');
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
                                <button onclick='editClient(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-warning btn-sm mt-2">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button onclick='deleteClient(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
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
            showError(response?.message || "No se pudieron obtener los clientes.");
        }
    } catch (error) {
        console.error("Error obteniendo clientes:", error);
        showError(error.message || "Error al cargar clientes");
    }
};

/**
 * Crear nuevo cliente
 */
const createClient = async () => {
    try {
        if (!validateSession()) return;

        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;
        const gender = document.getElementById("gender").value;
        const registrationDate = document.getElementById("registrationDate").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!name || !phone || !email || !gender || !registrationDate) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Por favor ingrese un email válido.");
            return;
        }

        // Validar fecha (no puede ser futura)
        const selectedDate = new Date(registrationDate);
        const today = new Date();
        if (selectedDate > today) {
            showError("La fecha de registro no puede ser futura.");
            return;
        }

        const clientData = {
            clientId: 0, // Para crear nuevo
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            gender: gender,
            registrationDate: registrationDate + 'T00:00:00.000Z', // Formato ISO
            isActive: isActive
        };

        const response = await postData(CLIENTS_API, clientData);

        if (response && response.success !== false) {
            showSuccess("Cliente creado correctamente");
            await obtainClients();
            clearClientForm();
        } else {
            showError(response?.message || "Error al crear cliente");
        }
    } catch (error) {
        console.error("Error creando cliente:", error);
        showError(error.message || "Error al crear cliente");
    }
};

/**
 * Editar cliente - llenar formulario con datos existentes
 */
const editClient = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos del cliente
        document.getElementById("clientId").value = row.clientId;
        document.getElementById("name").value = row.name || '';
        document.getElementById("phone").value = row.phone || '';
        document.getElementById("email").value = row.email || '';
        document.getElementById("gender").value = row.gender || '';
        
        // Formatear fecha para el input date
        if (row.registrationDate) {
            const date = new Date(row.registrationDate);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById("registrationDate").value = formattedDate;
        }
        
        document.getElementById("isActive").checked = row.isActive || false;

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Cliente";

        // Scroll al formulario
        document.getElementById('clientForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("Error editando cliente:", error);
        showError("Error al cargar datos del cliente");
    }
};

/**
 * Actualizar cliente existente
 */
const updateClient = async () => {
    try {
        if (!validateSession()) return;

        const clientId = document.getElementById("clientId").value;
        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;
        const gender = document.getElementById("gender").value;
        const registrationDate = document.getElementById("registrationDate").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!clientId) {
            showError("ID de cliente no válido");
            return;
        }

        if (!name || !phone || !email || !gender || !registrationDate) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Por favor ingrese un email válido.");
            return;
        }

        // Validar fecha (no puede ser futura)
        const selectedDate = new Date(registrationDate);
        const today = new Date();
        if (selectedDate > today) {
            showError("La fecha de registro no puede ser futura.");
            return;
        }

        const clientData = {
            clientId: parseInt(clientId),
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            gender: gender,
            registrationDate: registrationDate + 'T00:00:00.000Z', // Formato ISO
            isActive: isActive
        };

        const response = await putData(CLIENTS_API, clientData);

        if (response && response.success !== false) {
            showSuccess("Cliente actualizado correctamente");
            await obtainClients();
            clearClientForm();
        } else {
            showError(response?.message || "Error al actualizar cliente");
        }
    } catch (error) {
        console.error("Error actualizando cliente:", error);
        showError(error.message || "Error al actualizar cliente");
    }
};

/**
 * Eliminar cliente con confirmación (eliminación lógica)
 */
const deleteClient = async (row) => {
    try {
        if (!validateSession()) return;

        const clientId = row.clientId;
        const clientName = row.name;

        if (!clientId) {
            showError("ID de cliente no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar al cliente "${clientName}"? Esta acción desactivará al cliente del sistema.`,
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        // Para DELETE, enviar los datos completos del cliente
        const clientData = {
            clientId: parseInt(clientId),
            name: row.name,
            phone: row.phone,
            email: row.email,
            gender: row.gender,
            registrationDate: row.registrationDate,
            isActive: false // Desactivar en lugar de eliminar
        };

        const response = await deleteData(CLIENTS_GET_BY_ID_API(clientId), clientData);

        if (response === null || response?.success !== false) {
            showSuccess("Cliente eliminado correctamente");
            await obtainClients();
        } else {
            showError(response?.message || "Error al eliminar cliente");
        }
    } catch (error) {
        console.error("Error eliminando cliente:", error);
        showError(error.message || "Error al eliminar cliente");
    }
};

/**
 * Limpiar formulario de cliente
 */
const clearClientForm = () => {
    document.getElementById("clientForm").reset();
    document.getElementById("clientId").value = "";
    document.getElementById("registrationDate").value = new Date().toISOString().split('T')[0]; // Fecha actual
    document.getElementById("isActive").checked = true;
    document.getElementById("submitBtn").textContent = "Guardar Cliente";
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editClient = editClient;
window.deleteClient = deleteClient;

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

    const clientForm = document.getElementById("clientForm");
    if (clientForm) {
        clientForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const clientId = document.getElementById("clientId").value;
            
            if (clientId) {
                await updateClient();
            } else {
                await createClient();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearClientForm);
    }

    // Establecer fecha actual por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("registrationDate").value = today;

    // Cargar datos iniciales
    await obtainClients();
});