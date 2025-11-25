
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");


if (userInput) {
    const chatContainer = document.querySelector('.ai-chat-container');
    const inputArea = document.querySelector('.chat-input-area');
    const chatBox = document.getElementById('chatBox');
    

    function adjustInputPosition() {
        if (!inputArea || !chatContainer) return;
        
       
        if (window.visualViewport) {
            const viewportHeight = window.visualViewport.height;
            const inputRect = inputArea.getBoundingClientRect();
            const inputTop = inputRect.top;
            const inputBottom = inputRect.bottom;
            
            
            if (inputBottom > viewportHeight - 10) {
                const scrollAmount = inputBottom - viewportHeight + 30; 
             
                if (chatBox) {
                    chatBox.scrollTop += scrollAmount;
                }
            }
        } else {
           
            if (chatBox) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }
    }
    
  
    userInput.addEventListener('focus', function() {
       
        setTimeout(() => {
            adjustInputPosition();
        }, 300);
        
       
        setTimeout(() => {
            adjustInputPosition();
        }, 600);
    });

    
    userInput.addEventListener('input', function() {
        if (document.activeElement === userInput) {
            setTimeout(() => {
                adjustInputPosition();
            }, 50);
        }
    });
    

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function() {
            if (document.activeElement === userInput) {
                setTimeout(() => {
                    adjustInputPosition();
                }, 100);
            }
        });
    }
    

    userInput.addEventListener('blur', function() {
       
        setTimeout(() => {
            if (chatBox) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }, 300);
    });
}


const API_URL = "https://patient-river-127d.popoytydhdt.workers.dev/";



function addMessage(text, sender = "bot") {
    const wrapper = document.createElement("div");
    wrapper.classList.add("message", sender);
    wrapper.textContent = text;

    chatBox.appendChild(wrapper);
   
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
}



setTimeout(() => {
    addMessage("مرحباً بك في المساعد الذكي! كيف يمكنني مساعدتك؟ 🤖🔥", "bot");
}, 300);



chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = userInput.value.trim();
    if (!text) return;


    addMessage(text, "user");
    userInput.value = "";

 
    const loading = document.createElement("div");
    loading.classList.add("message", "bot");
    loading.textContent = "⏳ جاري التفكير...";
    chatBox.appendChild(loading);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: text })
        });

        const data = await response.json();
        loading.remove();

        const reply =
            data?.choices?.[0]?.message?.content ||
            "لم أفهم سؤالك، هل يمكنك توضيحه؟ 😊";

        addMessage(reply, "bot");

    } catch (err) {
        loading.remove();
        addMessage("⚠️ لا يوجد اتصال، تأكد من الإنترنت.", "bot");
    }
});

/* =========================
   تفعيل خلفية Spline فوق الصفحة
========================= */
// خلفية ثابتة: لا حاجة لتفعيل Spline

