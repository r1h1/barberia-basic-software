//Imports

const sessionValidate = () => {
    const sessionStatus = sessionStorage.getItem("session");
    if (!sessionStatus || sessionStatus != "ok") {
        sessionStorage.removeItem("session");
        location.href = "../../index.html";
    }
    else {
        console.log("Session OK");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    sessionValidate();
});