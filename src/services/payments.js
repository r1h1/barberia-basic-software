// payments.js
import { PAYMENTS_API, PAYMENTS_GET_BY_ID_API, APPOINTMENTS_API, CLIENTS_API } from "../config/constants.js";
import { getData, postData, putData, deleteData } from "../data/methods.js";
import { showError, showSuccess, showConfirmation, showAlert } from "../utils/sweetAlert.js";

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
let allPayments = [];
let allAppointments = [];
let allClients = [];

// ===== FUNCIONES PARA CARGAR SELECTS =====

/**
 * Cargar citas en el select
 */
const loadAppointments = async () => {
    try {
        const response = await getData(`${APPOINTMENTS_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            allAppointments = response.data;

            const appointmentSelect = document.getElementById("appointmentId");
            appointmentSelect.innerHTML = '<option value="" selected disabled>Seleccione una cita</option>';

            console.log(response);

            response.data.forEach(appointment => {
                // Solo mostrar citas activas que estén completadas
                if (appointment.isActive && appointment.status === 'Completada') {
                    
                    const option = document.createElement("option");
                    option.value = appointment.appointmentId;
                    
                    // Formatear fecha para mostrar
                    const appointmentDate = new Date(appointment.date);
                    const formattedDate = appointmentDate.toLocaleDateString('es-ES');
                    const startTime = formatTimeSpanToTime(appointment.startTime);
                    
                    option.textContent = `${appointment.clientName} (${formattedDate} ${startTime})`;
                    option.setAttribute('data-client-id', appointment.clientId);
                    appointmentSelect.appendChild(option);
                }
            });

            // Mostrar mensaje si no hay citas disponibles
            if (appointmentSelect.options.length === 1) {
                const option = document.createElement("option");
                option.value = "";
                option.textContent = "No hay citas disponibles para pago";
                option.disabled = true;
                appointmentSelect.appendChild(option);
            }
        } else {
            showError(response?.message || "No se pudieron cargar las citas.");
        }
    } catch (error) {
        showError("Error al cargar la lista de citas");
    }
};

/**
 * Cargar clientes en el select
 */
const loadClients = async () => {
    try {
        const response = await getData(`${CLIENTS_API}?onlyActive=true`);

        if (response && response.success !== false && response.data) {
            allClients = response.data;

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
        showError("Error al cargar la lista de clientes");
    }
};

/**
 * Cargar todos los datos necesarios para los selects
 */
const loadFormData = async () => {
    try {
        await Promise.all([
            loadAppointments(),
            loadClients()
        ]);
    } catch (error) {
        showError("Error al cargar los datos del formulario");
    }
};

// ===== FUNCIONES CRUD DE PAGOS =====

/**
 * Obtener todos los pagos y cargar en DataTable
 */
const obtainPayments = async () => {
    try {
        if (!validateSession()) return;

        const response = await getData(PAYMENTS_API);

        if (response && response.success !== false && response.data) {
            allPayments = response.data.filter(payment => payment.isActive !== false);

            $('#paymentsTable').DataTable({
                destroy: true,
                data: allPayments,
                columns: [
                    {
                        data: "paymentId",
                        title: "ID Pago"
                    },
                    {
                        data: "clientName",
                        title: "Cliente",
                        render: function (data, type, row) {
                            return data || `Cliente #${row.clientId}`;
                        }
                    },
                    {
                        data: "appointmentId",
                        title: "Cita",
                        render: function (data, type, row) {
                            return `Cita #${data}`;
                        }
                    },
                    {
                        data: "paymentType",
                        title: "Tipo Pago"
                    },
                    {
                        data: "totalAmount",
                        title: "Monto",
                        render: function (data) {
                            return `Q ${parseFloat(data).toFixed(2)}`;
                        }
                    },
                    {
                        data: "paymentDate",
                        title: "Fecha Pago",
                        render: function (data) {
                            if (!data) return '-';
                            const date = new Date(data);
                            return date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                        }
                    },
                    {
                        data: "status",
                        title: "Estado",
                        render: function (data) {
                            const statusClasses = {
                                'Completado': 'bg-success',
                                'Pendiente': 'bg-warning text-dark',
                                'Fallido': 'bg-danger',
                                'Reembolsado': 'bg-info',
                                'En Proceso': 'bg-primary'
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
                                <button onclick='editPayment(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
                                        class="btn btn-warning btn-sm mt-2">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button onclick='deletePayment(${JSON.stringify(row).replace(/'/g, "&#39;").replace(/"/g, "&quot;")})' 
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
            showError(response?.message || "No se pudieron obtener los pagos.");
        }
    } catch (error) {
        showError(error);
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
 * Crear nuevo pago
 */
const createPayment = async () => {
    try {
        if (!validateSession()) return;

        const appointmentId = document.getElementById("appointmentId").value;
        const clientId = document.getElementById("clientId").value;
        const paymentType = document.getElementById("paymentType").value;
        const authorizationNumber = document.getElementById("authorizationNumber").value;
        const transactionNumber = document.getElementById("transactionNumber").value;
        const totalAmount = document.getElementById("totalAmount").value;
        const paymentDate = document.getElementById("paymentDate").value;
        const status = document.getElementById("status").value;
        const isActive = document.getElementById("isActive").checked;

        // Validaciones básicas
        if (!appointmentId || !clientId || !paymentType || !totalAmount || !paymentDate || !status) {
            showError("Todos los campos obligatorios deben ser completados.");
            return;
        }

        // Validar campos específicos para tipos de pago electrónicos
        if ((paymentType === 'Tarjeta Débito' || paymentType === 'Tarjeta Crédito') && !authorizationNumber) {
            showError("El número de autorización es requerido para pagos con tarjeta.");
            return;
        }

        if ((paymentType === 'Transferencia' || paymentType === 'Digital') && !transactionNumber) {
            showError("El número de transacción es requerido para transferencias y pagos digitales.");
            return;
        }

        const paymentData = {
            paymentId: 0,
            appointmentId: parseInt(appointmentId),
            clientId: parseInt(clientId),
            paymentType: paymentType,
            authorizationNumber: authorizationNumber || "",
            transactionNumber: transactionNumber || "",
            totalAmount: parseFloat(totalAmount),
            paymentDate: paymentDate + ':00.000Z',
            status: status,
            isActive: isActive,
            appointmentDate: new Date().toISOString(),
            startTime: "00:00:00",
            endTime: "00:00:00",
            appointmentStatus: "Completada",
            clientName: "",
            success: 0,
            message: ""
        };

        const response = await postData(PAYMENTS_API, paymentData);

        if (response && response.success !== false) {
            showSuccess("Pago registrado correctamente");
            await obtainPayments();
            clearPaymentForm();
        } else {
            showError(response?.message || "Error al registrar pago");
        }
    } catch (error) {
        showError("Error al registrar pago");
    }
};

/**
 * Editar pago - llenar formulario con datos existentes
 */
const editPayment = async (row) => {
    try {
        if (!validateSession()) return;

        document.getElementById("paymentId").value = row.paymentId;
        document.getElementById("appointmentId").value = row.appointmentId || '';
        document.getElementById("clientId").value = row.clientId || '';
        document.getElementById("paymentType").value = row.paymentType || '';
        document.getElementById("authorizationNumber").value = row.authorizationNumber || '';
        document.getElementById("transactionNumber").value = row.transactionNumber || '';
        document.getElementById("totalAmount").value = row.totalAmount || '';
        
        // Formatear fecha para el input datetime-local
        if (row.paymentDate) {
            const date = new Date(row.paymentDate);
            const formattedDate = date.toISOString().slice(0, 16);
            document.getElementById("paymentDate").value = formattedDate;
        }
        
        document.getElementById("status").value = row.status || 'Completado';
        document.getElementById("isActive").checked = row.isActive !== false;

        // Mostrar campos según tipo de pago
        togglePaymentFields(row.paymentType);

        // Cambiar texto del botón
        document.getElementById("submitBtn").textContent = "Actualizar Pago";

        // Scroll al formulario
        document.getElementById('paymentForm').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showError("Error al cargar datos del pago");
    }
};

/**
 * Actualizar pago existente
 */
const updatePayment = async () => {
    try {
        if (!validateSession()) return;

        const paymentId = document.getElementById("paymentId").value;
        const appointmentId = document.getElementById("appointmentId").value;
        const clientId = document.getElementById("clientId").value;
        const paymentType = document.getElementById("paymentType").value;
        const authorizationNumber = document.getElementById("authorizationNumber").value;
        const transactionNumber = document.getElementById("transactionNumber").value;
        const totalAmount = document.getElementById("totalAmount").value;
        const paymentDate = document.getElementById("paymentDate").value;
        const status = document.getElementById("status").value;
        const isActive = document.getElementById("isActive").checked;

        if (!paymentId) {
            showError("ID de pago no válido");
            return;
        }

        if (!appointmentId || !clientId || !paymentType || !totalAmount || !paymentDate || !status) {
            showError("Todos los campos obligatorios deben ser completados.");
            return;
        }

        // Validar campos específicos para tipos de pago electrónicos
        if ((paymentType === 'Tarjeta Débito' || paymentType === 'Tarjeta Crédito') && !authorizationNumber) {
            showError("El número de autorización es requerido para pagos con tarjeta.");
            return;
        }

        if ((paymentType === 'Transferencia' || paymentType === 'Digital') && !transactionNumber) {
            showError("El número de transacción es requerido para transferencias y pagos digitales.");
            return;
        }

        const paymentData = {
            paymentId: parseInt(paymentId),
            appointmentId: parseInt(appointmentId),
            clientId: parseInt(clientId),
            paymentType: paymentType,
            authorizationNumber: authorizationNumber || "",
            transactionNumber: transactionNumber || "",
            totalAmount: parseFloat(totalAmount),
            paymentDate: paymentDate + ':00.000Z',
            status: status,
            isActive: isActive,
            appointmentDate: new Date().toISOString(),
            startTime: "00:00:00",
            endTime: "00:00:00",
            appointmentStatus: "Completada",
            clientName: "",
            success: 0,
            message: ""
        };

        const response = await putData(PAYMENTS_API, paymentData);

        if (response && response.success !== false) {
            showSuccess("Pago actualizado correctamente");
            await obtainPayments();
            clearPaymentForm();
        } else {
            showError(response?.message || "Error al actualizar pago");
        }
    } catch (error) {
        showError("Error al actualizar pago");
    }
};

/**
 * Eliminar pago con confirmación (eliminación lógica)
 */
const deletePayment = async (row) => {
    try {
        if (!validateSession()) return;

        const paymentId = row.paymentId;
        const clientName = row.clientName || `Cliente #${row.clientId}`;
        const paymentAmount = row.totalAmount;

        if (!paymentId) {
            showError("ID de pago no válido");
            return;
        }

        const confirmed = await showConfirmation(
            `¿Estás seguro de eliminar el pago de "${clientName}"?, Pago por Q ${parseFloat(paymentAmount).toFixed(2)} - Esta acción no se puede deshacer.`,
            "Sí, eliminar",
            "Cancelar"
        );

        if (!confirmed) {
            return;
        }

        const paymentData = {
            paymentId: parseInt(paymentId),
            appointmentId: row.appointmentId,
            clientId: row.clientId,
            paymentType: row.paymentType,
            authorizationNumber: row.authorizationNumber || "",
            transactionNumber: row.transactionNumber || "",
            totalAmount: row.totalAmount,
            paymentDate: row.paymentDate,
            status: 'Cancelada',
            isActive: false,
            appointmentDate: row.appointmentDate,
            startTime: row.startTime,
            endTime: row.endTime,
            appointmentStatus: row.appointmentStatus,
            clientName: row.clientName || "",
            success: 0,
            message: ""
        };

        const response = await deleteData(PAYMENTS_GET_BY_ID_API(paymentId), paymentData);

        if (response === null || response?.success !== false) {
            showSuccess("Pago eliminado correctamente");
            await obtainPayments();
        } else {
            showError(response?.message || "Error al eliminar pago");
        }
    } catch (error) {
        showError("Error al eliminar pago");
    }
};

/**
 * Limpiar formulario de pago
 */
const clearPaymentForm = () => {
    document.getElementById("paymentForm").reset();
    document.getElementById("paymentId").value = "";

    // Establecer valores por defecto
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 16);
    document.getElementById("paymentDate").value = formattedNow;
    document.getElementById("status").value = "Completado";
    document.getElementById("isActive").checked = true;

    // Ocultar campos adicionales
    document.getElementById("authorizationField").style.display = 'none';
    document.getElementById("transactionField").style.display = 'none';

    document.getElementById("submitBtn").textContent = "Registrar Pago";
};

/**
 * Mostrar/ocultar campos según tipo de pago
 */
const togglePaymentFields = (paymentType) => {
    const authField = document.getElementById("authorizationField");
    const transField = document.getElementById("transactionField");

    // Ocultar todos primero
    authField.style.display = 'none';
    transField.style.display = 'none';

    // Mostrar según tipo de pago
    if (paymentType === 'Tarjeta Débito' || paymentType === 'Tarjeta Crédito') {
        authField.style.display = 'block';
    } else if (paymentType === 'Transferencia' || paymentType === 'Digital') {
        transField.style.display = 'block';
    }
};

/**
 * Actualizar cliente cuando se selecciona una cita
 */
const updateClientFromAppointment = () => {
    const appointmentSelect = document.getElementById("appointmentId");
    const clientSelect = document.getElementById("clientId");
    const selectedAppointment = appointmentSelect.options[appointmentSelect.selectedIndex];
    
    if (selectedAppointment && selectedAppointment.value) {
        const clientId = selectedAppointment.getAttribute('data-client-id');
        if (clientId) {
            clientSelect.value = clientId;
        }
    }
};

// ===== ASIGNACIÓN DE FUNCIONES AL SCOPE GLOBAL =====
window.editPayment = editPayment;
window.deletePayment = deletePayment;

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
    validateSession();

    // Event Listeners
    const closeSessionBtn = document.getElementById("closeSession");
    if (closeSessionBtn) {
        closeSessionBtn.addEventListener("click", closeSession);
    }

    const paymentForm = document.getElementById("paymentForm");
    if (paymentForm) {
        paymentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const paymentId = document.getElementById("paymentId").value;

            if (paymentId) {
                await updatePayment();
            } else {
                await createPayment();
            }
        });
    }

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
        resetBtn.addEventListener("click", clearPaymentForm);
    }

    // Event listener para tipo de pago
    const paymentTypeSelect = document.getElementById("paymentType");
    if (paymentTypeSelect) {
        paymentTypeSelect.addEventListener("change", (e) => {
            togglePaymentFields(e.target.value);
        });
    }

    // Event listener para cita (actualizar cliente automáticamente)
    const appointmentSelect = document.getElementById("appointmentId");
    if (appointmentSelect) {
        appointmentSelect.addEventListener("change", updateClientFromAppointment);
    }

    // Establecer valores por defecto
    const now = new Date();
    const formattedNow = now.toISOString().slice(0, 16);
    document.getElementById("paymentDate").value = formattedNow;

    // Cargar datos iniciales
    await loadFormData();
    await obtainPayments();
});