        let timers = [];
        let isRunning = false;
        let lastRemovedTimer = null;
        let audioEnabled = false;
        let currentZoom = 1;

        function enableAudioPlayback() {
            if (!audioEnabled) {
                const audio = document.getElementById('timer-complete-sound');
                audio.muted = true;
                audio.play().catch(() => {});
                audio.pause();
                audio.currentTime = 0;
                audio.muted = false;
                audioEnabled = true;
                document.removeEventListener('click', enableAudioPlayback);
            }
        }

        function setVenue() {
            const venue = document.getElementById('venue-input').value.toUpperCase();
            document.getElementById('venue-display').textContent = venue;
        }

        function validateInput(moduleCode, hours, minutes) {
            if (!moduleCode || moduleCode.trim() === '') {
                alert('Please enter a valid module code');
                return false;
            }

            if (isNaN(hours) || isNaN(minutes)) {
                alert('Hours and minutes must be valid numbers');
                return false;
            }

            if (hours < 0 || minutes < 0) {
                alert('Time values cannot be negative');
                return false;
            }

            if (minutes >= 60) {
                alert('Minutes must be less than 60');
                return false;
            }

            if (hours === 0 && minutes === 0) {
                alert('Please enter a valid time');
                return false;
            }

            if (hours > 24) {
                alert('Maximum time limit is 24 hours');
                return false;
            }

            return true;
        }

        function updateTimerCounter() {
            const activeTimers = timers.filter(t => !t.isPaused && t.remainingTime > 0).length;
            const totalTimers = timers.length;
            document.getElementById('timer-counter').textContent = 
                `Active: ${activeTimers}/${totalTimers}`;
        }

        function addTimer() {
            const moduleCode = document.getElementById('module-code').value.trim().toUpperCase();
            const hours = parseInt(document.getElementById('hours').value) || 0;
            const minutes = parseInt(document.getElementById('minutes').value) || 0;

            if (!validateInput(moduleCode, hours, minutes)) {
                return;
            }

            const totalSeconds = (hours * 3600) + (minutes * 60);
            const timerId = Date.now();

            
            if (timers.some(timer => timer.moduleCode.toUpperCase() === moduleCode)) {
                alert('A timer for this module code already exists');
                return;
            }

        
            if (timers.length >= 10) {
                alert('Maximum number of timers (10) reached');
                return;
            }


            try {
                const timerDiv = document.createElement('div');
                timerDiv.className = 'timer';
                timerDiv.style.opacity = '0';
                timerDiv.id = `timer-${timerId}`;
                timerDiv.setAttribute('tabindex', '0');
                timerDiv.setAttribute('aria-label', `Timer for ${moduleCode}`);
                timerDiv.innerHTML = `
                    <div class="screw top-left"></div>
                    <div class="screw top-right"></div>
                    <div class="screw bottom-left"></div>
                    <div class="screw bottom-right"></div>
                    <h2>${moduleCode}</h2>
                    <div class="time-display">
                        ${formatTime(totalSeconds)}
                    </div>
                    <div class="timer-controls">
                        <button class="timer-btn pause-btn" onclick="pauseTimer(${timerId})">
                            <span class="btn-text">Pause</span>
                        </button>
                        <button class="timer-btn reset-btn" onclick="resetTimer(${timerId})">
                            <span class="btn-text">Reset</span>
                        </button>
                        <button class="timer-btn add-time-btn" onclick="addExtraTime(${timerId}, 60)">
                            +1m
                        </button>
                        <button class="timer-btn add-time-btn" onclick="addExtraTime(${timerId}, 300)">
                            +5m
                        </button>
                    </div>
                    <div class="progress-bar" style="width: 100%"></div>
                    <button class="remove-timer" onclick="removeTimer(${timerId})">×</button>
                `;

                document.getElementById('timers-container').appendChild(timerDiv);
                

                timerDiv.offsetHeight;
                timerDiv.style.opacity = '';

                timers.push({
                    id: timerId,
                    moduleCode: moduleCode,
                    remainingTime: totalSeconds,
                    originalTime: totalSeconds
                });


                document.getElementById('module-code').value = '';
                document.getElementById('hours').value = '';
                document.getElementById('minutes').value = '';


                updateTimerCounter();
            } catch (error) {
                console.error('Error creating timer:', error);
                alert('An error occurred while creating the timer');
            }
        }

        function startAllTimers() {
            if (isRunning) {
                alert('Timers are already running');
                return;
            }

            if (timers.length === 0) {
                alert('Please add at least one timer before starting');
                return;
            }

            try {
                isRunning = true;
                timers.forEach(timer => {
                    if (!timer.isPaused && timer.remainingTime > 0 && !timer.intervalId) {
                        timer.intervalId = setInterval(() => {
                            updateTimer(timer);
                        }, 1000);
                    }
                });

                document.getElementById('start-all').disabled = true;
                document.getElementById('setup-container').style.display = 'none';
            } catch (error) {
                console.error('Error starting timers:', error);
                alert('An error occurred while starting the timers');
                isRunning = false;
            }
        }

        function updateTimer(timer) {
            if (timer.isPaused || timer.remainingTime <= 0) {
                if (timer.intervalId) {
                    clearInterval(timer.intervalId);
                    timer.intervalId = null;
                }
                return;
            }

            timer.remainingTime--;
            const timerElement = document.getElementById(`timer-${timer.id}`);
            const timeDisplay = timerElement.querySelector('.time-display');
            const progressBar = timerElement.querySelector('.progress-bar');
            
            timeDisplay.textContent = formatTime(timer.remainingTime);
            

            const progressPercent = (timer.remainingTime / timer.originalTime) * 100;
            progressBar.style.width = `${progressPercent}%`;

            if (timer.remainingTime <= 300) {
                timeDisplay.classList.add('warning');
                progressBar.style.backgroundColor = 'var(--warning-color)';
            }


            if (timer.remainingTime === 0) {
                notifyTimerComplete(timer.id);
                updateTimerCounter();
                if (timer.intervalId) {
                    clearInterval(timer.intervalId);
                    timer.intervalId = null;
                }
            }
        }

        function pauseTimer(timerId) {
            const timer = timers.find(t => t.id === timerId);
            if (!timer) return;

            const timerElement = document.getElementById(`timer-${timerId}`);
            const pauseBtn = timerElement.querySelector('.pause-btn');
            
            if (timer.isPaused) {
                // Resume timer
                timer.isPaused = false;
                timerElement.classList.remove('paused');
                pauseBtn.innerHTML = '<span class="btn-text">Pause</span>';
                pauseBtn.classList.remove('paused');
                if (isRunning && timer.remainingTime > 0 && !timer.intervalId) {
                    timer.intervalId = setInterval(() => {
                        updateTimer(timer);
                    }, 1000);
                }
            } else {

                timer.isPaused = true;
                timerElement.classList.add('paused');
                pauseBtn.innerHTML = '<span class="btn-text">Resume</span>';
                pauseBtn.classList.add('paused');
                if (timer.intervalId) {
                    clearInterval(timer.intervalId);
                    timer.intervalId = null;
                }
            }
            updateTimerCounter();
        }

        function resetTimer(timerId) {
            const timer = timers.find(t => t.id === timerId);
            if (!timer) return;

            timer.remainingTime = timer.originalTime;
            timer.isPaused = false;

            const timerElement = document.getElementById(`timer-${timerId}`);
            const timeDisplay = timerElement.querySelector('.time-display');
            const progressBar = timerElement.querySelector('.progress-bar');
            const pauseBtn = timerElement.querySelector('.pause-btn');

            timeDisplay.textContent = formatTime(timer.remainingTime);
            progressBar.style.width = '100%';
            timerElement.classList.remove('paused', 'warning', 'finished');
            pauseBtn.innerHTML = '<span class="btn-text">Pause</span>';
            pauseBtn.classList.remove('paused');
        }

        function removeTimer(timerId) {
            try {
                const index = timers.findIndex(t => t.id === timerId);
                if (index > -1) {
                    const timer = timers[index];
                    lastRemovedTimer = { ...timer };
                    if (timer.intervalId) {
                        clearInterval(timer.intervalId);
                    }
                    
                    const timerElement = document.getElementById(`timer-${timerId}`);
                    if (timerElement) {

                        timerElement.classList.add('removing');

                        setTimeout(() => {
                            timerElement.remove();
                            timers.splice(index, 1);
                            updateTimerCounter();
                            showUndoButton();
                        }, 300);
                    }
                }
            } catch (error) {
                console.error('Error removing timer:', error);
                alert('An error occurred while removing the timer');
            }
        }

        function undoRemove() {
            if (lastRemovedTimer) {
                const timer = { ...lastRemovedTimer, intervalId: null };
                timers.push(timer);

                const timerDiv = document.createElement('div');
                timerDiv.className = 'timer';
                timerDiv.id = `timer-${timer.id}`;
                timerDiv.setAttribute('tabindex', '0');
                timerDiv.setAttribute('aria-label', `Timer for ${timer.moduleCode}`);
                timerDiv.innerHTML = `
                    <div class="screw top-left"></div>
                    <div class="screw top-right"></div>
                    <div class="screw bottom-left"></div>
                    <div class="screw bottom-right"></div>
                    <h2>${timer.moduleCode}</h2>
                    <div class="time-display">
                        ${formatTime(timer.remainingTime)}
                    </div>
                    <div class="timer-controls">
                        <button class="timer-btn pause-btn" onclick="pauseTimer(${timer.id})">
                            <span class="btn-text">${timer.isPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                        <button class="timer-btn reset-btn" onclick="resetTimer(${timer.id})">
                            <span class="btn-text">Reset</span>
                        </button>
                        <button class="timer-btn add-time-btn" onclick="addExtraTime(${timer.id}, 60)">
                            +1m
                        </button>
                        <button class="timer-btn add-time-btn" onclick="addExtraTime(${timer.id}, 300)">
                            +5m
                        </button>
                    </div>
                    <div class="progress-bar" style="width: ${(timer.remainingTime / timer.originalTime) * 100}%"></div>
                    <button class="remove-timer" onclick="removeTimer(${timer.id})">×</button>
                `;
                document.getElementById('timers-container').appendChild(timerDiv);

                if (timer.isPaused) timerDiv.classList.add('paused');
                if (timer.remainingTime === 0) timerDiv.classList.add('finished');


                if (isRunning && !timer.isPaused && timer.remainingTime > 0) {
                    timer.intervalId = setInterval(() => {
                        updateTimer(timer);
                    }, 1000);
                }

                updateTimerCounter();
                lastRemovedTimer = null;
                hideUndoButton();
            }
        }

        function showUndoButton() {
            const undoButton = document.getElementById('undo-button');
            undoButton.style.display = 'block';

            setTimeout(hideUndoButton, 15000);
        }

        function hideUndoButton() {
            const undoButton = document.getElementById('undo-button');
            undoButton.style.display = 'none';
            lastRemovedTimer = null;
        }

        function addExtraTime(timerId, seconds) {
            const timer = timers.find(t => t.id === timerId);
            if (!timer) return;

            timer.remainingTime += seconds;

            const timerElement = document.getElementById(`timer-${timerId}`);
            const timeDisplay = timerElement.querySelector('.time-display');
            const progressBar = timerElement.querySelector('.progress-bar');

            timeDisplay.textContent = formatTime(timer.remainingTime);
            
            const progressPercent = (timer.remainingTime / timer.originalTime) * 100;
            progressBar.style.width = `${progressPercent}%`;

            if (timer.remainingTime > 300) {
                timeDisplay.classList.remove('warning');
                progressBar.style.backgroundColor = 'linear-gradient(to right, #B87333, #D4AF37)';
            }
        }

        function addTimeToAll(seconds) {
            timers.forEach(timer => {
                addExtraTime(timer.id, seconds);
            });
        }

        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        function pauseAllTimers() {
            const pauseAllBtn = document.getElementById('pause-all');
            const allPaused = timers.every(timer => timer.isPaused);
            
            timers.forEach(timer => {
                const timerElement = document.getElementById(`timer-${timer.id}`);
                const pauseBtn = timerElement.querySelector('.pause-btn');
                
                if (allPaused) {
                    // Resume all
                    timer.isPaused = false;
                    timerElement.classList.remove('paused');
                    pauseBtn.innerHTML = '<span class="btn-text">Pause</span>';
                } else {
                    // Pause all
                    timer.isPaused = true;
                    timerElement.classList.add('paused');
                    pauseBtn.innerHTML = '<span class="btn-text">Resume</span>';
                }
            });

            pauseAllBtn.textContent = allPaused ? 'PAUSE ALL' : 'RESUME ALL';
            pauseAllBtn.classList.toggle('active', !allPaused);
            updateTimerCounter();
        }

        function resetAllTimers() {
            if (confirm('Are you sure you want to reset all timers?')) {
                timers.forEach(timer => {
                    timer.remainingTime = timer.originalTime;
                    timer.isPaused = false;
                    if (timer.intervalId) {
                        clearInterval(timer.intervalId);
                        timer.intervalId = null;
                    }
                    const timerElement = document.getElementById(`timer-${timer.id}`);
                    const timeDisplay = timerElement.querySelector('.time-display');
                    const progressBar = timerElement.querySelector('.progress-bar');
                    const pauseBtn = timerElement.querySelector('.pause-btn');
                    timeDisplay.textContent = formatTime(timer.remainingTime);
                    progressBar.style.width = '100%';
                    timerElement.classList.remove('paused', 'warning', 'finished');
                    pauseBtn.innerHTML = '<span class="btn-text">Pause</span>';
                    pauseBtn.classList.remove('paused');
                });
                const pauseAllBtn = document.getElementById('pause-all');
                pauseAllBtn.textContent = 'PAUSE ALL';
                pauseAllBtn.classList.remove('active');


                document.getElementById('start-all').disabled = false;
                document.getElementById('setup-container').style.display = '';
                isRunning = false;
            }
        }

        function notifyTimerComplete(timerId) {
            const timer = timers.find(t => t.id === timerId);
            if (!timer) return;

            const audio = document.getElementById('timer-complete-sound');
            audio.play().catch(error => console.log('Error playing sound:', error));


            const timerElement = document.getElementById(`timer-${timerId}`);
            timerElement.classList.add('finished');


            if (Notification.permission === 'granted') {
                new Notification('Timer Complete', {
                    body: `${timer.moduleCode} exam time has ended`,
                    icon: '/favicon.ico'
                });
            }


            document.getElementById('aria-live').textContent = `${timer.moduleCode} timer complete.`;
        }

        document.addEventListener('DOMContentLoaded', () => {

            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
            document.addEventListener('click', enableAudioPlayback, { once: true });
        });

        function usePreset(minutes) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            document.getElementById('hours').value = hours;
            document.getElementById('minutes').value = remainingMinutes;
            

            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent === `${minutes >= 60 ? minutes/60 : minutes}${minutes >= 60 ? 'h' : 'm'}`) {
                    btn.classList.add('active');
                }
            });
        }

        function showHelp() {
            document.getElementById('help-overlay').classList.remove('hidden');
        }
            
        function hideHelp() {
            document.getElementById('help-overlay').classList.add('hidden');
        }
        

        document.getElementById('help-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'help-overlay') {
                hideHelp();
            }
        });

        function toggleHighContrast() {
            document.body.classList.toggle('high-contrast');

            localStorage.setItem('highContrast', document.body.classList.contains('high-contrast'));
            

            const btn = document.getElementById('accessibility-btn');
            if (document.body.classList.contains('high-contrast')) {
                btn.style.backgroundColor = '#000000';
                btn.style.borderColor = '#FFFFFF';
                btn.style.color = '#FFFFFF';
            } else {
                btn.style.backgroundColor = 'var(--primary-color)';
                btn.style.borderColor = 'var(--primary-color)';
                btn.style.color = '#D4AF37';
            }
        }

        function toggleLightMode() {
            const isLightMode = document.body.classList.toggle('light-mode');

            if (isLightMode) {

                document.documentElement.style.setProperty('--primary-color', '#6C3D91');
                document.documentElement.style.setProperty('--accent-color', '#00889C');
                document.documentElement.style.setProperty('--neutral-color', '#78848E');
                document.documentElement.style.setProperty('--background-color', '#FFFFFF');
                document.documentElement.style.setProperty('--card-color', '#FFFFFF');
                document.documentElement.style.setProperty('--timer-text-color', '#000000');
            } else {
        
                document.documentElement.style.setProperty('--primary-color', '#6C3D91');
                document.documentElement.style.setProperty('--accent-color', '#00889C');
                document.documentElement.style.setProperty('--neutral-color', '#78848E');
                document.documentElement.style.setProperty('--background-color', '#2C2C2C');
                document.documentElement.style.setProperty('--card-color', '#373737');
                document.documentElement.style.setProperty('--timer-text-color', '#FFF');
            }
        }

        function updateDateTime() {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            const formattedTime = now.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('date-time-display').textContent = `${formattedDate} ${formattedTime}`;
        }

        document.addEventListener('DOMContentLoaded', updateDateTime);
        setInterval(updateDateTime, 1000);

        document.addEventListener('keydown', function(e) {

            const active = document.activeElement;
            if (active && active.classList.contains('timer')) {
                const timerId = parseInt(active.id.replace('timer-', ''));
                if ((e.key === ' ' || e.key === 'Enter') && !isNaN(timerId)) {
                    pauseTimer(timerId);
                    e.preventDefault();
                }
            }
        });

        document.getElementById('zoom-in-btn').addEventListener('click', function() {
            currentZoom = Math.min(currentZoom + 0.1, 2);
            document.body.style.zoom = currentZoom;
        });

        document.getElementById('zoom-out-btn').addEventListener('click', function() {
            currentZoom = Math.max(currentZoom - 0.1, 0.5);
            document.body.style.zoom = currentZoom;
        });

       
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
                currentZoom = Math.min(currentZoom + 0.1, 2);
                document.body.style.zoom = currentZoom;
            }
            if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
                currentZoom = Math.max(currentZoom - 0.1, 0.5);
                document.body.style.zoom = currentZoom;
            }
        });