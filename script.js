const inputOpcion = document.getElementById("input-opcion");
const btnAgregar = document.getElementById("btn-agregar");
const btnLimpiar = document.getElementById("btn-limpiar");
const btnGirar = document.getElementById("btn-girar");
const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
const textoMensaje = document.getElementById("mensaje");
const listaNombresUI = document.getElementById("lista-nombres");
const contadorNombres = document.getElementById("contador-nombres");

let opciones = []; 
const colores = ["#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e74c3c", "#e67e22"];
let gradosActuales = 0;
let girando = false; 
let indicePendienteEliminar = -1;

let audioCtx; 

function reproducirTick() {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(400, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.05);
}

// Empezamos en -1 para que no suene nada antes de empezar a girar
let sectorAnterior = -1; 

function monitorearGiro() {
    if (!girando) return; 
    
    const style = window.getComputedStyle(canvas);
    const matrix = new DOMMatrix(style.transform);
    
    // Obtenemos los grados de rotación del canvas
    let anguloActual = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    if (anguloActual < 0) anguloActual += 360;
    
    // ¡LA CORRECCIÓN!: Calculamos exactamente qué está pasando debajo de la flecha (270 grados)
    let anguloPuntero = (270 - anguloActual + 360) % 360;
    
    const tamañoPorcion = 360 / opciones.length;
    let sectorActual = Math.floor(anguloPuntero / tamañoPorcion);
    
    if (sectorActual !== sectorAnterior) {
        if (sectorAnterior !== -1) {
            reproducirTick(); // Solo suena si cruzamos una línea de verdad
        }
        sectorAnterior = sectorActual;
    }
    
    requestAnimationFrame(monitorearGiro);
}

function actualizarListaNombres() {
    listaNombresUI.innerHTML = ""; 
    contadorNombres.textContent = opciones.length; 

    opciones.forEach((nombre, indice) => {
        const li = document.createElement("li"); 
        li.textContent = nombre;

        const btnX = document.createElement("button"); 
        btnX.textContent = "✖";
        btnX.className = "btn-eliminar-x";
        
        btnX.addEventListener("click", () => {
            if (girando) return; 
            
            indicePendienteEliminar = -1;
            canvas.style.transition = 'none';
            gradosActuales = 0;
            canvas.style.transform = `rotate(0deg)`;

            opciones.splice(indice, 1); 
            
            dibujarRuleta(); 
            actualizarListaNombres(); 
            
            textoMensaje.textContent = nombre + " fue quitado manualmente";
            textoMensaje.style.color = "#e74c3c";
        });

        li.appendChild(btnX); 
        listaNombresUI.appendChild(li); 
    });
}

function dibujarRuleta() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cantidadOpciones = opciones.length;
    
    if (cantidadOpciones === 0) return;

    const anguloPorPorcion = (2 * Math.PI) / cantidadOpciones;

    for (let i = 0; i < cantidadOpciones; i++) {
        const anguloInicio = i * anguloPorPorcion;
        const anguloFin = anguloInicio + anguloPorPorcion;

        ctx.beginPath();
        ctx.moveTo(300, 300);
        ctx.arc(300, 300, 300, anguloInicio, anguloFin);
        ctx.fillStyle = colores[i % colores.length];
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(300, 300);
        ctx.rotate(anguloInicio + anguloPorPorcion / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px Arial"; 
        ctx.fillText(opciones[i], 275, 8); 
        ctx.restore();
    }
}

dibujarRuleta();

function agregarNuevaOpcion() {
    if (girando) return; 

    const nuevaOpcion = inputOpcion.value.trim();
    if (nuevaOpcion !== "") {
        opciones.push(nuevaOpcion);
        inputOpcion.value = "";
        
        dibujarRuleta();
        actualizarListaNombres(); 
        
        textoMensaje.textContent = nuevaOpcion + " fue agregado";
        textoMensaje.style.color = "#34495e";
        
        indicePendienteEliminar = -1; 
    }
}

btnAgregar.addEventListener('click', agregarNuevaOpcion);

inputOpcion.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        agregarNuevaOpcion();
    }
});

btnLimpiar.addEventListener('click', () => {
    if (girando) return;
    opciones = [];
    dibujarRuleta();
    actualizarListaNombres(); 
    textoMensaje.textContent = "Agrega opciones para empezar";
    textoMensaje.style.color = "#34495e";
    indicePendienteEliminar = -1;
});

btnGirar.addEventListener('click', () => {
    if (girando) return; 

    if (opciones.length === 0) {
        textoMensaje.textContent = "¡Agrega al menos una opción antes de girar!";
        textoMensaje.style.color = "#e74c3c";
        return;
    }

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (indicePendienteEliminar !== -1) {
        opciones.splice(indicePendienteEliminar, 1); 
        indicePendienteEliminar = -1; 
        
        canvas.style.transition = 'none';
        gradosActuales = 0;
        canvas.style.transform = `rotate(0deg)`;
        
        dibujarRuleta(); 
        actualizarListaNombres(); 
        
        canvas.offsetHeight; 
    }

    if (opciones.length === 1) {
        textoMensaje.textContent = "🎉 ¡Ganador definitivo: " + opciones[0] + "! 🎉";
        textoMensaje.style.color = "#2ecc71";
        return;
    }

    girando = true; 
    textoMensaje.textContent = ""; 
    document.body.style.pointerEvents = "none";
    
    // --- CAMBIO DE FÍSICA Y ANIMACIÓN ---
    // Subimos el tiempo a 12 segundos y pusimos una curva que tiene un final muuuy largo
    canvas.style.transition = 'transform 12s cubic-bezier(0.25, 0.1, 0.1, 1)';

    const gradosExtra = Math.floor(Math.random() * 360);
    // Subimos a 20 vueltas base (7200 grados) para compensar el tiempo extra y que vaya rápido al inicio
    const giroTotal = 7200 + gradosExtra; 
    
    gradosActuales += giroTotal;
    canvas.style.transform = `rotate(${gradosActuales}deg)`;

    sectorAnterior = -1; 
    requestAnimationFrame(monitorearGiro);
});

canvas.addEventListener('transitionend', () => {
    if (!girando) return; 

    const cantidadOpciones = opciones.length;
    const gradosNormalizados = gradosActuales % 360;
    const anguloPuntero = (270 - gradosNormalizados + 360) % 360;
    
    const tamañoPorcion = 360 / cantidadOpciones;
    const indiceSeleccionado = Math.floor(anguloPuntero / tamañoPorcion);

    const eliminado = opciones[indiceSeleccionado];
    
    textoMensaje.textContent = eliminado + " fue eliminado";
    textoMensaje.style.color = "#e74c3c";

    indicePendienteEliminar = indiceSeleccionado;

    girando = false; 
    document.body.style.pointerEvents = "auto";
});