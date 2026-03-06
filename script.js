const inputOpcion = document.getElementById("input-opcion");
const btnAgregar = document.getElementById("btn-agregar");
const btnGirar = document.getElementById("btn-girar"); 
const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
const textoMensaje = document.getElementById("mensaje");
const listaNombresUI = document.getElementById("lista-nombres");
const contadorNombres = document.getElementById("contador-nombres");
const btnModo = document.getElementById("btn-modo"); 

let opciones = []; 
const colores = ["#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e74c3c", "#e67e22"];
let gradosActuales = 0;
let girando = false; 
let indicePendienteEliminar = -1;
let modoEliminacion = true; 

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

let sectorAnterior = -1; 

function monitorearGiro() {
    if (!girando) return; 
    
    const style = window.getComputedStyle(canvas);
    const matrix = new DOMMatrix(style.transform);
    
    let anguloActual = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    if (anguloActual < 0) anguloActual += 360;
    
    let anguloPuntero = (270 - anguloActual + 360) % 360;
    
    const tamañoPorcion = 360 / opciones.length;
    let sectorActual = Math.floor(anguloPuntero / tamañoPorcion);
    
    if (sectorActual !== sectorAnterior) {
        if (sectorAnterior !== -1) {
            reproducirTick(); 
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
        
        const spanNombre = document.createElement("span");
        spanNombre.textContent = nombre;
        spanNombre.style.flex = "1"; 
        spanNombre.style.marginRight = "10px";
        spanNombre.style.wordBreak = "break-word";
        spanNombre.style.cursor = "text"; 
        spanNombre.title = "Doble clic para editar"; 
        
        spanNombre.addEventListener("dblclick", () => {
            if (girando) return; 

            spanNombre.style.display = "none";

            const inputEdicion = document.createElement("input");
            inputEdicion.type = "text";
            inputEdicion.value = nombre;
            inputEdicion.className = "input-edicion";

            let editado = false;
            const guardarEdicion = () => {
                if (editado) return; 
                editado = true;
                
                const nuevoNombre = inputEdicion.value.trim();
                if (nuevoNombre !== "" && nuevoNombre !== nombre) {
                    opciones[indice] = nuevoNombre;
                    dibujarRuleta(); 
                    textoMensaje.textContent = "Nombre actualizado";
                    textoMensaje.style.color = "#a07bb6";
                }
                actualizarListaNombres(); 
            };

            inputEdicion.addEventListener("keydown", (e) => {
                if (e.key === "Enter") guardarEdicion();
                if (e.key === "Escape") actualizarListaNombres(); 
            });

            inputEdicion.addEventListener("blur", guardarEdicion);

            li.insertBefore(inputEdicion, cajaBotones);
            inputEdicion.focus();
            inputEdicion.setSelectionRange(inputEdicion.value.length, inputEdicion.value.length);
        });

        const cajaBotones = document.createElement("div");
        cajaBotones.style.display = "flex";

        const btnX = document.createElement("button"); 
        btnX.textContent = "✖";
        btnX.className = "btn-eliminar-x";
        btnX.title = "Quitar participante";
        
        btnX.addEventListener("click", () => {
            if (girando) return; 
            
            indicePendienteEliminar = -1;
            canvas.style.transition = 'none';
            gradosActuales = 0;
            canvas.style.transform = `rotate(0deg)`;

            opciones.splice(indice, 1); 
            
            dibujarRuleta(); 
            actualizarListaNombres(); 
            
            textoMensaje.textContent = "Eliminaste a " + nombre;
            textoMensaje.style.color = "#e74c3c";
        });

        cajaBotones.appendChild(btnX);
        li.appendChild(spanNombre);
        li.appendChild(cajaBotones);
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

btnModo.addEventListener('click', () => {
    if (girando) return; 

    modoEliminacion = !modoEliminacion; 
    
    if (modoEliminacion) {
        btnModo.textContent = "Modo eliminacion";
        btnModo.style.backgroundColor = "#9b59b6"; 
        btnModo.style.color = "white";
    } else {
        btnModo.textContent = "Modo clasico";
        btnModo.style.backgroundColor = "#f1c40f"; 
        btnModo.style.color = "#333";
    }
    
    indicePendienteEliminar = -1; 
    textoMensaje.textContent = "Modo cambiado";
    textoMensaje.style.color = "#34495e";
});

btnGirar.addEventListener('click', () => {
    if (girando) return; 

    if (opciones.length === 0) {
        textoMensaje.textContent = "Agrega un nombre para iniciar";
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
        textoMensaje.textContent = "El ganador es " + opciones[0] ;
        textoMensaje.style.color = "#2ecc71";
        return;
    }

    girando = true; 
    textoMensaje.textContent = ""; 
    document.body.style.pointerEvents = "none";
    
    canvas.style.transition = 'transform 12s cubic-bezier(0.25, 0.1, 0.1, 1)';

    const gradosExtra = Math.floor(Math.random() * 360);
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

    const seleccionado = opciones[indiceSeleccionado];
    
    if (!modoEliminacion) {
        // MODO CLÁSICO: Gana el primero que cae
        textoMensaje.textContent = "El ganador es " + seleccionado;
        textoMensaje.style.color = "#2ecc71";
        indicePendienteEliminar = -1; 
    } else {
        // MODO ELIMINACIÓN:
        if (cantidadOpciones === 2) {
            // Lógica original restaurada: El que sale seleccionado, ¡GANA!
            textoMensaje.textContent = "El ganador es " + seleccionado;
            textoMensaje.style.color = "#2ecc71";
            
            opciones = [seleccionado];
            actualizarListaNombres(); 
            indicePendienteEliminar = -1; 
        } else {
            textoMensaje.textContent = seleccionado + " fue eliminado";
            textoMensaje.style.color = "#e74c3c";
            indicePendienteEliminar = indiceSeleccionado;
        }
    }

    girando = false; 
    document.body.style.pointerEvents = "auto";
});