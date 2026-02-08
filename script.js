// Configuración del número de WhatsApp (reemplazar con el número real)
const WHATSAPP_NUMBER = '+522381228849'; // Número del Dr. José Luis Ortiz Huerta

// Elementos del DOM
const form = document.getElementById('appointmentForm');
const submitBtn = form.querySelector('.btn-primary');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const whatsappFloat = document.getElementById('whatsappFloat');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Flatpickr para fecha
    flatpickr("#date", {
        locale: "es",
        dateFormat: "Y-m-d",
        minDate: "today",
        maxDate: new Date().fp_incr(365), // Máximo 1 año
        disable: [
            function(date) {
                // Deshabilitar fines de semana
                return (date.getDay() === 0 || date.getDay() === 6);
            }
        ],
        onDayCreate: function(dObj, dStr, fp, dayElement) {
            // Marcar días pasados como deshabilitados visualmente
            if (dayElement.dateObj < new Date().setHours(0,0,0,0)) {
                dayElement.classList.add('disabled');
                dayElement.setAttribute('disabled', 'disabled');
            }
        },
        onChange: function(selectedDates, dateStr) {
            validateField({ target: dateInput });
        }
    });

    // Inicializar Flatpickr para hora
    flatpickr("#time", {
        locale: "es",
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minTime: "08:00",
        maxTime: "17:00",
        minuteIncrement: 30,
        onChange: function(selectedDates, dateStr) {
            validateField({ target: timeInput });
        }
    });
    
    // Validación de Bootstrap
    form.addEventListener('submit', handleFormSubmit);
    
    // Validación en tiempo real
    form.addEventListener('input', validateField);
    form.addEventListener('change', validateField);
    
    // Botón flotante de WhatsApp
    whatsappFloat.addEventListener('click', function(e) {
        e.preventDefault();
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, '')}?text=Hola, quiero información sobre sus servicios médicos.`;
        window.open(whatsappUrl, '_blank');
    });
});

// Validación de campos en tiempo real
function validateField(event) {
    const field = event.target;
    const fieldGroup = field.closest('.col-12, .col-md-6');
    
    // Remover clases de validación anteriores
    field.classList.remove('is-valid', 'is-invalid');
    
    // Validar campo específico
    let isValid = true;
    
    switch(field.id) {
        case 'name':
            if (field.value.length < 3) {
                isValid = false;
            }
            break;
            
        case 'phone':
            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
            if (!phoneRegex.test(field.value) || field.value.length < 10) {
                isValid = false;
            }
            break;
            
        case 'reason':
            if (field.value.length < 10) {
                isValid = false;
            }
            break;
            
        case 'date':
        case 'time':
            if (!field.value) {
                isValid = false;
            }
            break;
    }
    
    // Aplicar clases de Bootstrap
    if (field.value.trim()) {
        if (isValid) {
            field.classList.add('is-valid');
            field.classList.remove('is-invalid');
        } else {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
        }
    }
    
    return isValid;
}

// Manejar envío del formulario
async function handleFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Validar formulario con Bootstrap
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showAlert('Por favor, completa todos los campos correctamente.', 'error');
        return;
    }
    
    // Validar que no sea fin de semana
    const selectedDate = new Date(dateInput.value);
    if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
        showAlert('Por favor, selecciona un día entre lunes y viernes.', 'error');
        return;
    }
    
    // Mostrar estado de carga
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(form);
        
        // Simular procesamiento
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Enviar a WhatsApp
        sendToWhatsApp(formData);
        
        // Mostrar mensaje de éxito
        showAlert('¡Cita agendada exitosamente! Se abrirá WhatsApp para confirmar.', 'success');
        
        // Resetear formulario después de un tiempo
        setTimeout(() => {
            form.reset();
            form.classList.remove('was-validated');
            // Limpiar clases de validación
            form.querySelectorAll('.is-valid, .is-invalid').forEach(field => {
                field.classList.remove('is-valid', 'is-invalid');
            });
            // Resetear Flatpickr
            dateInput._flatpickr.clear();
            timeInput._flatpickr.clear();
        }, 2000);
        
    } catch (error) {
        console.error('Error al agendar cita:', error);
        showAlert('Hubo un error al agendar la cita. Por favor intenta nuevamente.', 'error');
    } finally {
        // Restaurar botón
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Generar mensaje para WhatsApp
function generateWhatsAppMessage(formData) {
    const date = formatDate(formData.get('date'));
    const time = formatTime(formData.get('time'));
    
    const message = `🏥 *NUEVA SOLICITUD DE CITA MÉDICA* 🏥

📋 *DATOS DE LA CITA:*
• Fecha: ${date}
• Hora: ${time}

👤 *DATOS DEL PACIENTE:*
• Nombre: ${formData.get('name')}
• Teléfono: ${formData.get('phone')}

📝 *MOTIVO DE CONSULTA:*
${formData.get('reason')}

---
*Por favor confirmar la cita a la brevedad posible.*`;
    
    return encodeURIComponent(message);
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// Formatear hora
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Enviar a WhatsApp
function sendToWhatsApp(formData) {
    const message = generateWhatsAppMessage(formData);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, '')}?text=${message}`;
    
    // Abrir WhatsApp en una nueva pestaña
    window.open(whatsappUrl, '_blank');
}

// Mostrar alertas personalizadas
function showAlert(text, type = 'success') {
    // Eliminar alertas existentes
    const existingAlert = document.querySelector('.alert-custom');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Crear nueva alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-custom alert-${type}-custom position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}"></i>
        <span>${text}</span>
    `;
    
    // Insertar al inicio del body
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Prevenir envío con Enter en campos individuales
form.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        // Mover al siguiente campo
        const fields = Array.from(form.querySelectorAll('input, textarea'));
        const currentIndex = fields.indexOf(e.target);
        if (currentIndex < fields.length - 1) {
            fields[currentIndex + 1].focus();
        }
    }
});

// Animación de entrada para las tarjetas de información
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar tarjetas de información
document.addEventListener('DOMContentLoaded', function() {
    const infoCards = document.querySelectorAll('.card.border-0.shadow-sm');
    infoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });
});
