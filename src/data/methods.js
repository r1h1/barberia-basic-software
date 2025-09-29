// Métodos de API reutilizables y simplificados

/**
 * Función genérica para realizar peticiones HTTP
 * @param {string} url - URL del endpoint
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {object} data - Datos a enviar (opcional para POST/PUT)
 * @param {object} customHeaders - Headers personalizados (opcional)
 * @returns {Promise} - Promesa con la respuesta
 */
async function apiRequest(url, method, data = null, customHeaders = {}) {
    const config = {
        method,
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            ...customHeaders
        }
    };

    // Agregar body solo para POST y PUT
    if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;

        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            errorMessage = await response.text();
        }

        throw new Error(errorMessage);
    }

    // Si la respuesta es 204 No Content, retornar null
    if (response.status === 204) {
        return null;
    }

    return await response.json();
}

/**
 * Función especializada para GET requests
 * @param {string} url - URL del endpoint
 * @param {object} headers - Headers personalizados (opcional)
 * @returns {Promise} - Promesa con los datos
 */
async function getData(url, headers = {}) {
    return apiRequest(url, 'GET', null, headers);
}

/**
 * Función especializada para POST requests
 * @param {string} url - URL del endpoint
 * @param {object} data - Datos a enviar
 * @param {object} headers - Headers personalizados (opcional)
 * @returns {Promise} - Promesa con la respuesta
 */
async function postData(url, data, headers = {}) {
    return apiRequest(url, 'POST', data, headers);
}

/**
 * Función especializada para PUT requests
 * @param {string} url - URL del endpoint
 * @param {object} data - Datos a actualizar
 * @param {object} headers - Headers personalizados (opcional)
 * @returns {Promise} - Promesa con la respuesta
 */
async function putData(url, data, headers = {}) {
    return apiRequest(url, 'PUT', data, headers);
}

/**
 * Función especializada para DELETE requests
 * @param {string} url - URL del endpoint
 * @param {object} headers - Headers personalizados (opcional)
 * @returns {Promise} - Promesa con la respuesta
 */
async function deleteData(url, headers = {}) {
    return apiRequest(url, 'DELETE', null, headers);
}

// Exportar funciones
export {
    apiRequest,
    getData,
    postData,
    putData,
    deleteData
};