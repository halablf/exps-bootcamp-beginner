// Quiz answers for each module
const quizAnswers = {
    1: ['a', 'b', 'c', 'b', 'c'], // Module 1 answers
    2: ['b', 'b', 'b', 'b', 'd'], // Module 2 answers
    3: ['b', 'b', 'a', 'b', 'a']  // Module 3 answers
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if we're on the homepage
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        updateProgress();
        updateModuleStatus();
    }
    
    // Initialize code editor functionality
    initializeCodeEditor();
    
    // Initialize quiz functionality
    initializeQuiz();
    
    // Initialize exercise completion
    initializeExercise();
}

// Progress tracking functions
function updateProgress() {
    const progress = getProgress();
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
        const percentage = (progress.completedModules / 3) * 100;
        progressFill.style.width = percentage + '%';
        progressText.textContent = Math.round(percentage) + '% Complete';
    }
}

function updateModuleStatus() {
    const progress = getProgress();
    
    for (let i = 1; i <= 3; i++) {
        const statusElement = document.getElementById(`status${i}`);
        if (statusElement) {
            if (progress.completedModules.includes(i)) {
                statusElement.textContent = 'Completed';
                statusElement.classList.add('completed');
            } else {
                statusElement.textContent = 'Not Started';
                statusElement.classList.remove('completed');
            }
        }
    }
}

function getProgress() {
    const progress = localStorage.getItem('bootcampProgress');
    if (progress) {
        return JSON.parse(progress);
    }
    return {
        completedModules: [],
        quizScores: {},
        exerciseCompleted: {}
    };
}

function saveProgress(progress) {
    localStorage.setItem('bootcampProgress', JSON.stringify(progress));
}

function markModuleComplete(moduleNumber) {
    const progress = getProgress();
    if (!progress.completedModules.includes(moduleNumber)) {
        progress.completedModules.push(moduleNumber);
        saveProgress(progress);
        
        // Update UI if on homepage
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            updateProgress();
            updateModuleStatus();
        }
        
        // Show success message
        showNotification('Module completed! Great job!', 'success');
    }
}

// Code editor functionality
function initializeCodeEditor() {
    const runBtn = document.getElementById('runBtn');
    const codeEditor = document.getElementById('codeEditor');
    const preview = document.getElementById('preview');
    
    if (runBtn && codeEditor && preview) {
        runBtn.addEventListener('click', function() {
            executeCode();
        });
        
        // Auto-run code when typing (with debounce)
        let timeout;
        codeEditor.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(executeCode, 1000);
        });
        
        // Initial code execution
        executeCode();
    }
}

function executeCode() {
    const codeEditor = document.getElementById('codeEditor');
    const preview = document.getElementById('preview');
    
    if (codeEditor && preview) {
        const code = codeEditor.value;
        
        try {
            // Create a new iframe for safe code execution
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '300px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '8px';
            
            // Clear previous content
            preview.innerHTML = '';
            preview.appendChild(iframe);
            
            // Write the code to the iframe
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(code);
            iframeDoc.close();
            
        } catch (error) {
            preview.innerHTML = `<div style="color: red; padding: 1rem;">Error: ${error.message}</div>`;
        }
    }
}

// Quiz functionality
function initializeQuiz() {
    const submitBtn = document.getElementById('submitQuiz');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            submitQuiz();
        });
    }
}

function submitQuiz() {
    const currentModule = getCurrentModule();
    if (!currentModule) return;
    
    const answers = quizAnswers[currentModule];
    const userAnswers = [];
    let allAnswered = true;
    
    // Collect user answers
    for (let i = 1; i <= 5; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected) {
            userAnswers.push(selected.value);
        } else {
            allAnswered = false;
            break;
        }
    }
    
    if (!allAnswered) {
        showNotification('Please answer all questions before submitting.', 'error');
        return;
    }
    
    // Calculate score
    let correctAnswers = 0;
    for (let i = 0; i < answers.length; i++) {
        if (userAnswers[i] === answers[i]) {
            correctAnswers++;
        }
    }
    
    const score = (correctAnswers / answers.length) * 100;
    const resultDiv = document.getElementById('quizResult');
    
    // Save quiz score
    const progress = getProgress();
    progress.quizScores[currentModule] = score;
    saveProgress(progress);
    
    // Display result
    if (score >= 80) {
        resultDiv.innerHTML = `
            <div class="quiz-result success">
                <h4>🎉 Great job!</h4>
                <p>You scored ${score}% (${correctAnswers}/5 correct)</p>
                <p>You've passed the quiz!</p>
            </div>
        `;
        resultDiv.className = 'quiz-result success';
        
        // Mark module as complete if exercise is also done
        checkModuleCompletion(currentModule);
    } else {
        resultDiv.innerHTML = `
            <div class="quiz-result error">
                <h4>📚 Keep learning!</h4>
                <p>You scored ${score}% (${correctAnswers}/5 correct)</p>
                <p>Review the material and try again. You need 80% to pass.</p>
            </div>
        `;
        resultDiv.className = 'quiz-result error';
    }
}

// Exercise functionality
function initializeExercise() {
    const completeBtn = document.getElementById('completeExercise');
    if (completeBtn) {
        completeBtn.addEventListener('click', function() {
            markExerciseComplete();
        });
    }
}

function markExerciseComplete() {
    const currentModule = getCurrentModule();
    if (!currentModule) return;
    
    const progress = getProgress();
    progress.exerciseCompleted[currentModule] = true;
    saveProgress(progress);
    
    // Mark module as complete if quiz is also done
    checkModuleCompletion(currentModule);
    
    showNotification('Exercise marked as complete!', 'success');
}

function checkModuleCompletion(moduleNumber) {
    const progress = getProgress();
    const quizPassed = progress.quizScores[moduleNumber] >= 80;
    const exerciseDone = progress.exerciseCompleted[moduleNumber];
    
    if (quizPassed && exerciseDone) {
        markModuleComplete(moduleNumber);
    }
}

// Utility functions
function getCurrentModule() {
    const path = window.location.pathname;
    if (path.includes('module1.html')) return 1;
    if (path.includes('module2.html')) return 2;
    if (path.includes('module3.html')) return 3;
    return null;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#dc3545';
    } else {
        notification.style.backgroundColor = '#17a2b8';
    }
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to run code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const runBtn = document.getElementById('runBtn');
        if (runBtn) {
            e.preventDefault();
            runBtn.click();
        }
    }
    
    // Ctrl/Cmd + S to save progress (prevent default save dialog)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showNotification('Progress is automatically saved!', 'info');
    }
});

// Add some helpful features
function addHelpfulFeatures() {
    // Add syntax highlighting hints
    const codeEditor = document.getElementById('codeEditor');
    if (codeEditor) {
        codeEditor.addEventListener('focus', function() {
            showNotification('💡 Tip: Use Ctrl+Enter to run your code quickly!', 'info');
        });
    }
    
    // Add progress indicator on module pages
    const currentModule = getCurrentModule();
    if (currentModule) {
        const progress = getProgress();
        const quizScore = progress.quizScores[currentModule] || 0;
        const exerciseDone = progress.exerciseCompleted[currentModule] || false;
        
        // Create progress indicator
        const progressIndicator = document.createElement('div');
        progressIndicator.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 999;
            min-width: 200px;
        `;
        
        progressIndicator.innerHTML = `
            <h4 style="margin: 0 0 0.5rem 0; color: #2c3e50;">Module Progress</h4>
            <div style="margin-bottom: 0.5rem;">
                <span style="color: ${quizScore >= 80 ? '#28a745' : '#6c757d'};">📝 Quiz: ${quizScore}%</span>
            </div>
            <div>
                <span style="color: ${exerciseDone ? '#28a745' : '#6c757d'};">💻 Exercise: ${exerciseDone ? 'Done' : 'Pending'}</span>
            </div>
        `;
        
        document.body.appendChild(progressIndicator);
    }
}

// Initialize helpful features
setTimeout(addHelpfulFeatures, 1000);

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading states for buttons
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn')) {
        const originalText = e.target.textContent;
        e.target.textContent = 'Loading...';
        e.target.disabled = true;
        
        setTimeout(() => {
            e.target.textContent = originalText;
            e.target.disabled = false;
        }, 1000);
    }
});

// Add confirmation for exercise completion
document.addEventListener('click', function(e) {
    if (e.target.id === 'completeExercise') {
        if (!confirm('Are you sure you want to mark this exercise as complete? Make sure you\'ve actually completed the task!')) {
            e.preventDefault();
            return false;
        }
    }
});

// Add auto-save indicator
function showAutoSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.textContent = '💾 Auto-saved';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
    `;
    
    document.body.appendChild(indicator);
    
    // Show indicator
    setTimeout(() => {
        indicator.style.opacity = '1';
    }, 100);
    
    // Hide after 2 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }, 2000);
}

// Show auto-save indicator when progress is saved
const originalSaveProgress = saveProgress;
saveProgress = function(progress) {
    originalSaveProgress(progress);
    showAutoSaveIndicator();
}; 