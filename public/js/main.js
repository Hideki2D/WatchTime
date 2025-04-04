document.addEventListener('DOMContentLoaded', () => {
    sessionStorage.setItem('visitedFromMain', 'true');
    // Обробник кнопки "Створити кімнату"
    document.getElementById('create-room').addEventListener('click', () => {
        fetch('/createRoom', { method: 'POST' })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Помилка мережі');
                }
                return response.json();
            })
            .then(data => {
                window.location.href = `/room/${data.roomId}`;
            })
            .catch(error => {
                console.error('Помилка:', error);
                alert('Помилка при створенні кімнати. Спробуйте ще раз.');
            });
    });

    // Обробник кнопки "Приєднатися"
    document.getElementById('join-room').addEventListener('click', () => {
        const roomId = document.getElementById('room-id').value.trim();
        if (roomId) {
            // Просто перенаправляємо - перевірка буде на сторінці кімнати
            window.location.href = `/room/${roomId}`;
        } else {
            alert('Будь ласка, введіть код кімнати');
        }
    });

    // Обробник Enter у полі введення
    document.getElementById('room-id').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('join-room').click();
        }
    });
});