// ==========================================================
// CHECKOUT Y CONFIRMACIÓN DE COMPRA 
// ==========================================================

(() => {

document.addEventListener('DOMContentLoaded', () => {
    // El badge ya se actualiza automáticamente gracias a utilidades.js
    renderizarResumenCheckout();
    configurarMascaras();
    configurarMetodosEntrega();
    configurarFormularioCheckout();
});

// Renderiza la lista de productos del carrito y recalcular los totales
function renderizarResumenCheckout() {
    const carrito = obtener('carrito');
    const listaContenedor = document.getElementById('checkout-items-list');
    const subtotalEl = document.getElementById('subtotal');
    const envioEl = document.getElementById('envio');
    const impuestosEl = document.getElementById('impuestos');
    const totalEl = document.getElementById('checkout-total');

    if (!listaContenedor) return;

    if (carrito.length === 0) {
        listaContenedor.innerHTML = '<p class="text-muted text-center py-3">Tu carrito está vacío.</p>';
        if (subtotalEl) subtotalEl.textContent = formatearPrecio(0) + ' MXN';
        if (envioEl) envioEl.textContent = formatearPrecio(0) + ' MXN';
        if (impuestosEl) impuestosEl.textContent = formatearPrecio(0) + ' MXN';
        if (totalEl) totalEl.textContent = formatearPrecio(0) + ' MXN';
        const btnPagar = document.getElementById('btn-pagar');
        if (btnPagar) {
            btnPagar.disabled = true;
            btnPagar.style.opacity = '0.6';
            btnPagar.style.cursor = 'not-allowed';
        }
        return;
    }

    listaContenedor.innerHTML = '';
    carrito.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'd-flex justify-content-between align-items-center mb-3 pb-2 border-bottom';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'd-flex align-items-center gap-2';

        const img = document.createElement('img');
        img.src = item.imagen;
        img.alt = item.nombre;
        img.style.width = '45px';
        img.style.height = '45px';
        img.style.objectFit = 'contain';

        const textDiv = document.createElement('div');
        
        const title = document.createElement('h6');
        title.className = 'mb-0 fw-bold';
        title.style.fontSize = '0.9rem';
        title.textContent = item.nombre;

        const subtitle = document.createElement('small');
        subtitle.className = 'text-muted';
        const precioTotalVariante = obtenerPrecioReal(item.id, item.varianteId || item.variante);
        subtitle.textContent = `${item.cantidad} x ${formatearPrecio(precioTotalVariante)} MXN`;

        textDiv.appendChild(title);
        textDiv.appendChild(subtitle);

        infoDiv.appendChild(img);
        infoDiv.appendChild(textDiv);

        const priceSpan = document.createElement('span');
        priceSpan.className = 'fw-bold';
        priceSpan.textContent = formatearPrecio(precioTotalVariante * item.cantidad);

        itemDiv.appendChild(infoDiv);
        itemDiv.appendChild(priceSpan);
        
        listaContenedor.appendChild(itemDiv);
    });

    const subtotalProductos = carrito.reduce((acc, item) => acc + (obtenerPrecioReal(item.id, item.varianteId || item.variante) * item.cantidad), 0);
    
    let costoEnvio = 0;
    const metodoSeleccionado = document.querySelector('input[name="metodoEntrega"]:checked');
    const valorMetodo = metodoSeleccionado ? metodoSeleccionado.value : 'estandar';
    
    if (subtotalProductos > 0) {
        if (valorMetodo === 'expres') costoEnvio = 120.00;
        else if (valorMetodo === 'estandar') costoEnvio = 50.00;
        else if (valorMetodo === 'tienda') costoEnvio = 0.00;
    }

    const total = subtotalProductos + costoEnvio;
    // Calculamos cuánto de ese total corresponde a IVA (16%)
    const impuestos = total - (total / 1.16);

    if (subtotalEl) subtotalEl.textContent = `${formatearPrecio(subtotalProductos)} MXN`;
    if (envioEl) envioEl.textContent = `${formatearPrecio(costoEnvio)} MXN`;
    if (impuestosEl) impuestosEl.textContent = `${formatearPrecio(impuestos)} MXN`;
    if (totalEl) totalEl.textContent = `${formatearPrecio(total)} MXN`;
}

// Configurar los métodos de entrega
function configurarMetodosEntrega() {
    const radiosEntrega = document.querySelectorAll('input[name="metodoEntrega"]');
    radiosEntrega.forEach(radio => {
        radio.addEventListener('change', renderizarResumenCheckout);
    });
}

// Máscaras de escritura dinámica
function configurarMascaras() {
    const tarjetaInput = document.getElementById('tarjeta');
    const expiracionInput = document.getElementById('expiracion');
    const cpInput = document.getElementById('cp');
    const telInput = document.getElementById('telefono');

    if (tarjetaInput) {
        tarjetaInput.addEventListener('input', (e) => {
            let valor = e.target.value.replace(/\D/g, '');
            valor = valor.replace(/(.{4})/g, '$1 ').trim();
            e.target.value = valor.substring(0, 19);
        });
    }

    if (expiracionInput) {
        expiracionInput.addEventListener('input', (e) => {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor.length >= 3) {
                valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
            }
            e.target.value = valor.substring(0, 5);
        });
    }

    if (cpInput) {
        cpInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 5);
        });
    }

    if (telInput) {
        telInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
        });
    }
}

// Envío del formulario y Modal
function configurarFormularioCheckout() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const carrito = obtener('carrito');

        if (carrito.length === 0) {
            alert('El carrito está vacío. Agrega productos antes de realizar la compra.');
            return;
        }

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            form.reportValidity();
            return;
        }

        mostrarModalResumen(carrito);
    });

    // Nueva función para mostrar el resumen antes de procesar
    function mostrarModalResumen(carrito) {
        const contenedor = document.getElementById('resumen-contenido-modal');
        if (!contenedor) return;
        
        // Obtener valores
        const nombre = document.getElementById('nombre').value;
        const direccion = document.getElementById('direccion').value;
        const ciudad = document.getElementById('ciudad').value;
        const estado = document.getElementById('estado').value;
        const cp = document.getElementById('cp').value;
        const tarjetaVal = document.getElementById('tarjeta').value;
        const tarjeta = tarjetaVal.length >= 4 ? tarjetaVal.slice(-4) : '****';
        
        const metodoSeleccionado = document.querySelector('input[name="metodoEntrega"]:checked');
        const valorMetodo = metodoSeleccionado ? metodoSeleccionado.value : 'estandar';
        let textoMetodo = 'Envío Estándar';
        let costoEnvio = 0;
        
        let subtotalProductos = carrito.reduce((acc, item) => acc + (obtenerPrecioReal(item.id, item.varianteId || item.variante) * item.cantidad), 0);

        if (subtotalProductos > 0) {
            if (valorMetodo === 'expres') { textoMetodo = 'Envío Exprés'; costoEnvio = 120.00; }
            else if (valorMetodo === 'estandar') { textoMetodo = 'Envío Estándar'; costoEnvio = 50.00; }
            else if (valorMetodo === 'tienda') { textoMetodo = 'Recogida en tienda'; costoEnvio = 0.00; }
        }
        
        const total = subtotalProductos + costoEnvio;

        let html = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <h5 class="fw-bold">Datos de Envío</h5>
                    <p class="mb-1"><strong>Nombre:</strong> ${nombre}</p>
                    <p class="mb-1"><strong>Dirección:</strong> ${direccion}, ${ciudad}, ${estado}. CP: ${cp}</p>
                    <p class="mb-1"><strong>Método:</strong> ${textoMetodo}</p>
                </div>
                <div class="col-md-6 mb-3">
                    <h5 class="fw-bold">Método de Pago</h5>
                    <p class="mb-1">Tarjeta terminada en: <strong>**** ${tarjeta}</strong></p>
                </div>
            </div>
            <hr>
            <h5 class="fw-bold">Productos</h5>
            <ul class="list-group mb-3">
        `;
        
        carrito.forEach(item => {
            html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${item.cantidad}x ${item.nombre} <small class="text-muted ms-2">${item.variante || ''}</small></span>
                <span>${formatearPrecio(obtenerPrecioReal(item.id, item.varianteId || item.variante) * item.cantidad)} MXN</span>
            </li>`;
        });
        
        html += `</ul>
            <div class="d-flex justify-content-between">
                <strong>Subtotal:</strong> <span>${formatearPrecio(subtotalProductos)} MXN</span>
            </div>
            <div class="d-flex justify-content-between">
                <strong>Envío:</strong> <span>${formatearPrecio(costoEnvio)} MXN</span>
            </div>
            <div class="d-flex justify-content-between fs-5 mt-2 border-top pt-2 text-primary">
                <strong>Total a Pagar:</strong> <strong>${formatearPrecio(total)} MXN</strong>
            </div>
        `;
        
        contenedor.innerHTML = html;
        
        const modalResumenEl = document.getElementById('modalResumenCompra');
        const modalResumen = new bootstrap.Modal(modalResumenEl);
        modalResumen.show();
        actualizarProgreso(66, 2);

        // Revertir la barra si el usuario cierra el modal sin confirmar
        modalResumenEl.addEventListener('hidden.bs.modal', () => {
            const btnPagar = document.getElementById('btn-pagar');
            if (btnPagar && !btnPagar.disabled) {
                actualizarProgreso(33, 1);
            }
        }, { once: true });
        
        // Configurar evento de confirmación final
        const btnConfirmar = document.getElementById('btn-confirmar-pedido');
        // Remover eventos previos
        const nuevoBtn = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);
        
        nuevoBtn.addEventListener('click', () => {
            modalResumen.hide();
            procesarCompraFinal(carrito);
        });
    }

    function procesarCompraFinal(carrito) {
        actualizarProgreso(100, 3);
        const form = document.getElementById('checkout-form');
        const btnPagar = document.getElementById('btn-pagar');
        if (btnPagar) {
            btnPagar.disabled = true;
            btnPagar.textContent = 'Procesando...';
            btnPagar.style.pointerEvents = 'none';
            btnPagar.style.opacity = '0.6';
            btnPagar.style.cursor = 'not-allowed';
        }

        // Deshabilitar todos los inputs del formulario para evitar modificaciones o envíos secundarios
        Array.from(form.elements).forEach(el => {
            el.disabled = true;
        });

        const numOrden = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        const numeroOrdenEl = document.getElementById('numero-orden-modal');
        if (numeroOrdenEl) numeroOrdenEl.textContent = numOrden;

        // --- Generación del Archivo TXT (Recibo) ---
        const metodoSeleccionado = document.querySelector('input[name="metodoEntrega"]:checked');
        const valorMetodo = metodoSeleccionado ? metodoSeleccionado.value : 'estandar';
        let textoMetodo = 'Estándar';
        let costoEnvio = 0;

        let subtotalProductos = 0;
        carrito.forEach(item => {
            const precio = obtenerPrecioReal(item.id, item.varianteId || item.variante);
            subtotalProductos += precio * item.cantidad;
        });

        if (subtotalProductos > 0) {
            if (valorMetodo === 'expres') { textoMetodo = 'Exprés'; costoEnvio = 120.00; }
            else if (valorMetodo === 'estandar') { textoMetodo = 'Estándar'; costoEnvio = 50.00; }
            else if (valorMetodo === 'tienda') { textoMetodo = 'Recogida en tienda'; costoEnvio = 0.00; }
        }

        const nombre = document.getElementById('nombre').value;
        const direccion = document.getElementById('direccion').value;
        const ciudad = document.getElementById('ciudad').value;
        const cp = document.getElementById('cp').value;

        let contenidoTxt = `Comprobante de pedido - TechShop EDU\n`;
        contenidoTxt += `Generado: ${new Date().toLocaleString('es-MX')}\n`;
        contenidoTxt += `========================================\n`;
        contenidoTxt += `Cliente: ${nombre}\n`;
        contenidoTxt += `Dirección: ${direccion}, ${ciudad}, CP ${cp}\n`;
        contenidoTxt += `Método de entrega: ${textoMetodo}\n`;
        
        carrito.forEach(item => {
            const precio = obtenerPrecioReal(item.id, item.varianteId || item.variante);
            const totalItem = precio * item.cantidad;
            const varianteTexto = item.variante ? ` (${item.variante})` : '';
            contenidoTxt += `Producto: ${item.nombre}${varianteTexto} x${item.cantidad} - ${formatearPrecio(totalItem)}\n`;
        });
        
        const total = subtotalProductos + costoEnvio;

        contenidoTxt += `----------------------------------------\n`;
        contenidoTxt += `TOTAL: ${formatearPrecio(total)}\n`;

        const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
        const enlaceDescarga = document.createElement('a');
        enlaceDescarga.href = URL.createObjectURL(blob);
        enlaceDescarga.download = `Recibo_${numOrden}.txt`;
        enlaceDescarga.style.display = 'none';
        document.body.appendChild(enlaceDescarga);
        enlaceDescarga.click();
        document.body.removeChild(enlaceDescarga);
        // ------------------------------------------

        localStorage.removeItem('carrito');
        actualizarContadorCarrito();

        const modalEl = document.getElementById('modalConfirmacion');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalEl, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();

            const btnVolver = document.getElementById('btn-volver-inicio');
            if (btnVolver) {
                btnVolver.addEventListener('click', () => {
                    window.location.href = 'index.html';
                });
            }
        } else {
            alert(`¡Compra confirmada!\nOrden: ${numOrden}`);
            window.location.href = 'index.html';
        }
    }
}

// Actualiza la barra de progreso
function actualizarProgreso(porcentaje, pasoActivo) {
    const barra = document.getElementById('barra-progreso');
    if (barra) {
        barra.style.width = porcentaje + '%';
        barra.parentElement.setAttribute('aria-valuenow', porcentaje);
    }
    for (let i = 1; i <= 3; i++) {
        const span = document.getElementById('paso-' + i);
        if (span) {
            if (i <= pasoActivo) {
                span.classList.add('text-primary');
                span.classList.remove('text-muted');
            } else {
                span.classList.remove('text-primary');
                span.classList.add('text-muted');
            }
        }
    }
}

// Escuchar cambios en el carrito desde otras pestañas para actualizar el resumen
window.addEventListener('storage', (evento) => {
    if (evento.key === 'carrito' || evento.key === null) {
        renderizarResumenCheckout();
    }
});

})();