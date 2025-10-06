// Imports
import { APPOINTMENTS_API, APPOINTMENTS_GET_BY_ID_API, CLIENTS_API, EMPLOYEES_API, SERVICES_API, SCHEDULES_API } from "../config/constants.js";
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

// ===== VARIABLES GLOBALES =====
let allEmployees = [];
let allServices = [];
let employeeSchedules = [];

// ===== FUNCIONES PARA CARGAR SELECTS =====

/**
 * Cargar clientes en el select
 */
const loadClients = async () => {
    try {
        const response = await getData(`${CLIENTS_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            const clientSelect = document.getElementById("clientId");
            clientSelect.innerHTML = '<option value="" selected disabled>Seleccione un cliente</option>';

            response.data.forEach(client => {
                const option = document.createElement("option");
                option.value = client.clientId;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
        } else {
            showError(response?.message || "No se pudieron cargar los clientes.");
        }
    } catch (error) {
        console.error("Error cargando clientes:", error);
        showError("Error al cargar la lista de clientes");
    }
};

/**
 * Cargar empleados en el select
 */
const loadEmployees = async () => {
    try {
        const response = await getData(`${EMPLOYEES_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            allEmployees = response.data; // Guardar para usar después

            const employeeSelect = document.getElementById("employeeId");
            employeeSelect.innerHTML = '<option value="" selected disabled>Seleccione un empleado</option>';

            response.data.forEach(employee => {
                const option = document.createElement("option");
                option.value = employee.employeeId;
                option.textContent = employee.name;
                employeeSelect.appendChild(option);
            });
        } else {
            showError(response?.message || "No se pudieron cargar los empleados.");
        }
    } catch (error) {
        console.error("Error cargando empleados:", error);
        showError("Error al cargar la lista de empleados");
    }
};

/**
 * Cargar servicios en el select
 */
const loadServices = async () => {
    try {
        const response = await getData(`${SERVICES_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            allServices = response.data;

            const serviceSelect = document.getElementById("serviceName");
            serviceSelect.innerHTML = '<option value="" selected disabled>Seleccione un servicio</option>';

            response.data.forEach(service => {
                const option = document.createElement("option");
                option.value = service.name; // ⚡ Usar el nombre como valor
                option.textContent = `${service.name} (${service.durationMin} min)`;
                option.setAttribute('data-duration', service.durationMin);
                serviceSelect.appendChild(option);
            });
        } else {
            showError(response?.message || "No se pudieron cargar los servicios.");
        }
    } catch (error) {
        console.error("Error cargando servicios:", error);
        showError("Error al cargar la lista de servicios");
    }
};

/**
 * Cargar todos los datos necesarios para los selects
 */
const loadFormData = async () => {
    try {
        await Promise.all([
            loadClients(),
            loadEmployees(),
            loadServices()
        ]);
    } catch (error) {
        showError("Error al cargar los datos del formulario");
    }
};

// ===== FUNCIONES DE DISPONIBILIDAD =====

/**
 * Actualizar duración basada en el servicio seleccionado
 */
const updateDurationFromService = () => {
    const serviceSelect = document.getElementById("serviceName");
    const durationSelect = document.getElementById("durationMin");
    const selectedService = serviceSelect.options[serviceSelect.selectedIndex];

    if (selectedService && selectedService.value) {
        const duration = selectedService.getAttribute('data-duration');
        if (duration) {
            durationSelect.value = duration;
        }
    }
};

// ===== FUNCIONES CRUD DE CITAS =====

/**
 * Obtener todas las citas y cargar en DataTable
 */
const obtainAppointments = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(APPOINTMENTS_API);

        if (response && response.success !== false && response.data) {
            const activeAppointments = response.data.filter(appointment => appointment.isActive !== false);

            $('#appointmentsTable').DataTable({
                destroy: true,
                data: activeAppointments,
                columns: [
                    {
                        data: "appointmentId",
                        title: "ID"
                    },
                    {
                        data: null,
                        title: "Servicio",
                        render: function (data, type, row) {
                            // Mostrar serviceName directamente, si es null mostrar "No especificado"
                            return data.serviceName || "No especificado";
                        }
                    },
                    {
                        data: "clientName",
                        title: "Cliente",
                        render: function (data, type, row) {
                            return data || `Cliente #${row.clientId}`;
                        }
                    },
                    {
                        data: "employeeName",
                        title: "Empleado",
                        render: function (data, type, row) {
                            return data || `Empleado #${row.employeeId}`;
                        }
                    },
                    {
                        data: "date",
                        title: "Fecha",
                        render: function (data) {
                            if (!data) return '-';
                            const date = new Date(data);
                            return date.toLocaleDateString('es-ES');
                        }
                    },
                    {
                        data: "startTime",
                        title: "Hora Inicio",
                        render: function (data) {
                            if (!data) return '-';
                            return formatTimeSpanToTime(data);
                        }
                    },
                    {
                        data: "endTime",
                        title: "Hora Fin",
                        render: function (data) {
                            if (!data) return '-';
                            return formatTimeSpanToTime(data);
                        }
                    },
                    {
                        data: "status",
                        title: "Estado",
                        render: function (data) {
                            const statusClasses = {
                                'Programada': 'bg-secondary',
                                'Confirmada': 'bg-primary',
                                'En Progreso': 'bg-warning text-dark',
                                'Completada': 'bg-success',
                                'Cancelada': 'bg-danger',
                                'No Presentado': 'bg-dark'
                            };
                            const statusClass = statusClasses[data] || 'bg-secondary';
                            return `<span class="badge ${statusClass}">${data}</span>`;
                        }
                    },
                    {
                        data: null,
                        title: "Acciones",
                        render: function (data, type, row) {
                            return `
                                <button onclick='editAppointment(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-warning btn-sm mt-2">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button onclick='deleteAppointment(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-danger btn-sm mt-2">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            `;
                        }
                    }
                ],
                dom: 'Bfrtip',
                buttons: [
                    { extend: 'copy', className: 'btn btn-secondary' },
                    { extend: 'excel', className: 'btn btn-secondary' },
                    { extend: 'pdf', className: 'btn btn-secondary' },
                    { extend: 'print', className: 'btn btn-secondary' }
                ],
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json' },
                pageLength: 10,
                responsive: true,
                order: [[0, 'desc']]
            });
        } else {
            showError(response?.message || "No se pudieron obtener las citas.");
        }
    } catch (error) {
        console.error("Error obteniendo citas:", error);
    }
};

/**
 * Convertir TimeSpan a formato HH:mm para mostrar
 */
const formatTimeSpanToTime = (timeSpan) => {
    if (!timeSpan) return '';
    if (timeSpan.match(/^\d{2}:\d{2}$/)) return timeSpan;
    if (timeSpan.match(/^\d{2}:\d{2}:\d{2}$/)) return timeSpan.substring(0, 5);
    return timeSpan;
};

/**
 * Convertir formato HH:mm a TimeSpan para la API
 */
const formatTimeToTimeSpan = (time) => {
    if (!time) return '00:00:00';
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time;
    if (time.match(/^\d{2}:\d{2}$/)) return time + ':00';
    return '00:00:00';
};

/**
 * 
 * Crear nueva cita
 */
const createAppointment = async () => {
    try {
        if (!validateSession()) return;

        // Obtener valores del formulario
        const clientId = document.getElementById("clientId").value;
        const employeeId = document.getElementById("employeeId").value;
        const date = document.getElementById("date").value;
        const startTime = document.getElementById("startTime").value;
        const durationMin = document.getElementById("durationMin").value;
        const serviceName = document.getElementById("serviceName").value;
        const status = document.getElementById("status").value;
        const notes = document.getElementById("notes").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones básicas
        if (!clientId || !employeeId || !date || !startTime || !durationMin || !serviceName || !status) {
            showError("Todos los campos obligatorios deben ser completados.");
            return;
        }

        // Validación específica para serviceName
        if (serviceName === "" || serviceName === "Seleccione un servicio") {
            showError("Por favor seleccione un servicio válido.");
            return;
        }

        // Calcular hora de fin
        const endTime = calculateEndTime(startTime, parseInt(durationMin));
        const formattedStartTime = formatTimeToTimeSpan(startTime);
        const formattedEndTime = formatTimeToTimeSpan(endTime);

        // CONSTRUIR OBJETO EXACTO COMO LA API ESPERA
        const appointmentData = {
            appointmentId: 0,
            clientId: parseInt(clientId),
            employeeId: parseInt(employeeId),
            date: date + 'T00:00:00.000Z', // Formato ISO
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            notes: notes.trim(),
            status: status,
            isActive: isActive,
            serviceName: serviceName,
            durationMin: parseInt(durationMin),
            clientName: "",
            employeeName: "",
            success: 0,
            message: ""
        };

        const response = await postData(APPOINTMENTS_API, appointmentData);

        if (response && response.success !== false) {
            showSuccess("Cita creada correctamente");
            await obtainAppointments();
            clearAppointmentForm();
        } else {
            showError(response?.message || "Error al crear cita");
        }
    } catch (error) {
        console.error("💥 Error creando cita:", error);
        showError(error.message || "Error al crear cita");
    }
};

/**
 * Calcular hora de fin basada en hora inicio y duración
 */
const calculateEndTime = (startTime, durationMin) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMin * 60000);
    return endDate.toTimeString().substring(0, 5);
};

/**
 * Editar cita - llenar formulario con datos existentes
 */
const editAppointment = async (row) => {
    try {
        if (!validateSession()) return;

        // Llenar formulario con datos de la cita
        document.getElementById("appointmentId").value = row.appointmentId;
        document.getElementById("clientId").value = row.clientId || '';
        document.getElementById("employeeId").value = row.employeeId || '';

        // Formatear fecha
        if (row.date) {
            const date = new Date(row.date);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById("date").value = formattedDate;
        }

        // Convertir TimeSpan a formato HH:mm
        document.getElementById("startTime").value = formatTimeSpanToTime(row.startTime) || '';
        document.getElementById("durationMin").value = row.durationMin || 30;

        // ⚡ ESTA ES LA PARTE IMPORTANTE - asegurar que serviceName se cargue
        document.getElementById("serviceName").value = row.serviceName || '';

        document.getElementById("status").value = row.status || 'Programada';
        document.getElementById("notes").value = row.notes || '';
        document.getElementById("isActive").checked = row.isActive !== false;

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Cita";

        // Scroll al formulario
        document.getElementById('appointmentForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error("💥 Error editando cita:", error);
        showError("Error al cargar datos de la cita");
    }
};
/**
 * Actualizar cita existente
 */
const updateAppointment = async () => {
    try {
        if (!validateSession()) return;

        const appointmentId = document.getElementById("appointmentId").value;
        const clientId = document.getElementById("clientId").value;
        const employeeId = document.getElementById("employeeId").value;
        const date = document.getElementById("date").value;
        const startTime = document.getElementById("startTime").value;
        const durationMin = document.getElementById("durationMin").value;
        const serviceName = document.getElementById("serviceName").value;
        const status = document.getElementById("status").value;
        const notes = document.getElementById("notes").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones
        if (!appointmentId) {
            showError("ID de cita no válido");
            return;
        }

        if (!clientId || !employeeId || !date || !startTime || !durationMin || !serviceName || !status) {
            showError("Todos los campos obligatorios deben ser completados.");
            return;
        }

        // Validación específica para serviceName
        if (serviceName === "" || serviceName === "Seleccione un servicio") {
            showError("Por favor seleccione un servicio válido.");
            return;
        }

        // Calcular hora de fin
        const endTime = calculateEndTime(startTime, parseInt(durationMin));
        const formattedStartTime = formatTimeToTimeSpan(startTime);
        const formattedEndTime = formatTimeToTimeSpan(endTime);

        // CONSTRUIR OBJETO EXACTO COMO LA API ESPERA
        const appointmentData = {
            appointmentId: parseInt(appointmentId),
            clientId: parseInt(clientId),
            employeeId: parseInt(employeeId),
            date: date + 'T00:00:00.000Z',
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            notes: notes.trim(),
            status: status,
            isActive: isActive,
            serviceName: serviceName, // ⚡ ESTE ES EL CAMPO CLAVE
            durationMin: parseInt(durationMin),
            // Estos campos podrían ser necesarios para la API
            clientName: "",
            employeeName: "",
            success: 0,
            message: ""
        };

        const response = await putData(APPOINTMENTS_API, appointmentData);

        if (response && response.success !== false) {
            showSuccess("Cita actualizada correctamente");
            await obtainAppointments();
            clearAppointmentForm();
        } else {
            showError(response?.message || "Error al actualizar cita");
        }
    } catch (error) {
        console.error("Error actualizando cita:", error);
        showError(error.message || "Error al actualizar cita");
    }
};

/**
 * Eliminar cita con confirmación (eliminación lógica)
 */
const deleteAppointment = async (row) => {
    try {
        if (!validateSession()) return;

        const appointmentId = row.appointmentId;
        const clientName = row.clientName || `Cliente #${row.clientId}`;
        const appointmentDate = row.date ? new Date(row.date).toLocaleDateString('es-ES') : '';

        if (!appointmentId) {
            showError("ID de cita no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar la cita de "${clientName}"?, programada para el ${appointmentDate} a las ${formatTimeSpanToTime(row.startTime)}.`,
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        const appointmentData = {
            appointmentId: parseInt(appointmentId),
            clientId: row.clientId,
            employeeId: row.employeeId,
            date: row.date,
            startTime: row.startTime,
            endTime: row.endTime,
            notes: row.notes,
            status: 'Cancelada',
            isActive: false,
            serviceName: row.serviceName,
            durationMin: row.durationMin,
            clientName: row.clientName || "",
            employeeName: row.employeeName || "",
            success: 0,
            message: ""
        };

        const response = await deleteData(APPOINTMENTS_GET_BY_ID_API(appointmentId), appointmentData);

        if (response === null || response?.success !== false) {
            showSuccess("Cita eliminada correctamente");
            await obtainAppointments();
        } else {
            showError(response?.message || "Error al eliminar cita");
        }
    } catch (error) {
        console.error("Error eliminando cita:", error);
        showError(error.message || "Error al eliminar cita");
    }
};

/**
 * Limpiar formulario de cita
 */
const clearAppointmentForm = () => {
    document.getElementById("appointmentForm").reset();
    document.getElementById("appointmentId").value = "";

    // Establecer valores por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("date").value = today;
    document.getElementById("durationMin").value = "30";
    document.getElementById("status").value = "Programada";
    document.getElementById("isActive").checked = true;
    document.getElementById("submitBtn").textContent = "Guardar Cita";
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    // Validar sesión
    validateSession();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const appointmentForm = document.getElementById("appointmentForm");
    if (appointmentForm) {
        appointmentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const appointmentId = document.getElementById("appointmentId").value;

            if (appointmentId) {
                await updateAppointment();
            } else {
                await createAppointment();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearAppointmentForm);
    }

    const serviceSelect = document.getElementById("serviceName");
    if (serviceSelect) {
        serviceSelect.addEventListener("change", updateDurationFromService);
    }

    // Establecer valores por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("date").value = today;

    // Cargar datos iniciales
    await loadFormData();
    await obtainAppointments();
});