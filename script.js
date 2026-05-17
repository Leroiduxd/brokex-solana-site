document.addEventListener('DOMContentLoaded', () => {
    const typewriterElements = document.querySelectorAll('.typewriter-text');
    const words = [
        "AAPL/USD",
        "XAU/USD",
        "BTC/USD",
        "EUR/USD",
        "SPX/USD",
        "WTI/USD",
        "TSLA/USD",
        "ETH/USD"
    ];
    
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 150;

    function type() {
        const currentWord = words[wordIndex];
        const text = isDeleting 
            ? currentWord.substring(0, charIndex - 1)
            : currentWord.substring(0, charIndex + 1);
        
        typewriterElements.forEach(el => {
            el.textContent = text;
        });

        if (isDeleting) {
            charIndex--;
            typeSpeed = 50;
        } else {
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2500;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 300;
        }

        setTimeout(type, typeSpeed);
    }

    // Theme Toggle Logic
    const themeToggles = document.querySelectorAll('.theme-toggle-btn');
    const htmlElement = document.documentElement;

    themeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            if (htmlElement.getAttribute('data-always-dark') === 'true') return;
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    });

    // Load saved theme
    const alwaysDark = htmlElement.getAttribute('data-always-dark') === 'true';
    if (alwaysDark) {
        htmlElement.setAttribute('data-theme', 'dark');
    } else {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            htmlElement.setAttribute('data-theme', savedTheme);
        }
    }

    // Mobile Menu Logic
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenuTrigger = document.getElementById('mobile-menu-trigger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMenu() {
        if (menuToggle) menuToggle.classList.toggle('active');
        if (mobileMenuTrigger) mobileMenuTrigger.classList.toggle('active');
        if (mobileMenu) mobileMenu.classList.toggle('active');
        document.body.style.overflow = (mobileMenu && mobileMenu.classList.contains('active')) ? 'hidden' : '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    
    if (mobileMenuTrigger) {
        mobileMenuTrigger.addEventListener('click', toggleMenu);
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuToggle) menuToggle.classList.remove('active');
            if (mobileMenuTrigger) mobileMenuTrigger.classList.remove('active');
            if (mobileMenu) mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });


    // Advanced Mouse tracking
    const goldBox = document.querySelector('.gold-box');
    const circles = document.querySelector('.concentric-circles');

    if (goldBox && circles) {
        let mouseX = 110; targetX = 110;
        let mouseY = 110; targetY = 110;
        let isInside = false;

        window.addEventListener('mousemove', (e) => {
            const rect = goldBox.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                isInside = true;
            } else {
                isInside = false;
                targetX = ((e.clientX - rect.left) / rect.width) * 100;
                targetY = ((e.clientY - rect.top) / rect.height) * 100;
            }
        });

        function animateCircles() {
            if (!isInside) {
                mouseX += (targetX - mouseX) * 0.05;
                mouseY += (targetY - mouseY) * 0.05;
                circles.style.setProperty('--mouse-x', `${mouseX}%`);
                circles.style.setProperty('--mouse-y', `${mouseY}%`);
            }
            requestAnimationFrame(animateCircles);
        }
        animateCircles();
    }

    // Start the typewriter effect
    if (typewriterElements.length > 0) {
        type();
    }

    // --- Live Ticker Logic ---
    const TICKER_ASSETS = [
        { symbol: "BTC", id: "Crypto.BTC/USD" },
        { symbol: "ETH", id: "Crypto.ETH/USD" },
        { symbol: "SOL", id: "Crypto.SOL/USD" },
        { symbol: "AAPL", id: "Equity.US.AAPL/USD" },
        { symbol: "NVDA", id: "Equity.US.NVDA/USD" },
        { symbol: "GOLD", id: "Metal.XAU/USD" },
        { symbol: "EUR", id: "FX.EUR/USD" }
    ];

    const STREAM_URL = "https://benchmarks.pyth.network/v1/shims/tradingview/streaming";
    const DIFF_URL = "https://benchmarks.pyth.network/v1/price_differences/";
    const tickerWraps = document.querySelectorAll('.ticker-wrap');
    const assetElements = new Map();

    async function initTicker() {
        if (tickerWraps.length === 0) return;

        let differences = [];
        try {
            const res = await fetch(DIFF_URL);
            if (res.ok) differences = await res.json();
        } catch (e) {}

        const displayAssets = [...TICKER_ASSETS, ...TICKER_ASSETS];

        tickerWraps.forEach(wrap => {
            displayAssets.forEach((asset) => {
                const diffData = differences.find(d => d.symbol === asset.id);
                const dayDiff = diffData ? diffData.day_price_diff_decimal : 0;
                const diffClass = dayDiff >= 0 ? 'up' : 'down';
                const sign = dayDiff >= 0 ? '+' : '';

                const item = document.createElement('div');
                item.className = 'ticker-item';
                item.innerHTML = `
                    <span class="symbol">${asset.symbol}/USD</span>
                    <span class="price">$ --.--</span>
                    <span class="change ${diffClass}">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 4px;">
                            <path d="${dayDiff >= 0 ? 'M7 17l9.2-9.2M17 17V7H7' : 'M7 7l9.2 9.2M7 17h10V7'}"/>
                        </svg>
                        ${sign}${(dayDiff * 100).toFixed(2)}%
                    </span>
                `;
                wrap.appendChild(item);
                
                if (!assetElements.has(asset.id)) assetElements.set(asset.id, []);
                assetElements.get(asset.id).push({
                    price: item.querySelector('.price')
                });
            });
        });

        startScrolling();
        startStreaming();
    }

    function startScrolling() {
        tickerWraps.forEach(wrap => {
            let offset = 0;
            const scrollSpeed = 50; // Pixels per second
            let lastTime = null;

            function scroll(timestamp) {
                if (!lastTime) lastTime = timestamp;
                const deltaTime = (timestamp - lastTime) / 1000;
                lastTime = timestamp;

                offset -= scrollSpeed * deltaTime;
                if (Math.abs(offset) >= (wrap.scrollWidth / 2)) {
                    offset = 0;
                }
                wrap.style.transform = `translate3d(${offset}px, 0, 0)`;
                requestAnimationFrame(scroll);
            }
            requestAnimationFrame(scroll);
        });
    }

    function formatPrice(p) {
        if (p >= 100) {
            return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return p.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }

    async function startStreaming() {
        try {
            const response = await fetch(STREAM_URL);
            if (!response.ok) throw new Error('Stream offline');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.id && data.p) updateTickerUI(data);
                        } catch (e) {}
                    }
                }
            }
        } catch (err) {
            setTimeout(startStreaming, 3000);
        }
    }

    function updateTickerUI(data) {
        const cleanId = data.id.replace('.POST', '').replace('.PRE', '');
        const elements = assetElements.get(cleanId);
        if (elements) {
            elements.forEach(el => {
                el.price.textContent = `$ ${formatPrice(data.p)}`;
            });
        }
    }

    // --- Matrix/Cyberpunk Hover Text Scramble Decrypt Animation ---
    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    
    class TextScrambler {
        constructor(el) {
            this.el = el;
            this.update = this.update.bind(this);
        }
        
        setText(newText) {
            const oldText = this.el.textContent;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => this.resolve = resolve);
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                // Progressive reveal: start increases with index `i` (left-to-right sweep)
                const start = i * 2.0 + Math.floor(Math.random() * 5);
                const end = start + 10 + Math.floor(Math.random() * 10);
                this.queue.push({ from, to, start, end, char: '' });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        
        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.3) {
                        char = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                        this.queue[i].char = char;
                    }
                    output += char;
                } else {
                    output += from;
                }
            }
            this.el.textContent = output;
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
    }

    const scrambleElements = document.querySelectorAll(
        '.btn-trade, .btn-secondary, .nav-links a, .mobile-link, .whitepaper-nav a, .btn-ask-ai, [data-scramble]'
    );

    scrambleElements.forEach(el => {
        // Handle elements with nested text containers to maintain structured layouts
        let targets = [];
        const btnTexts = el.querySelectorAll('.btn-text, .text-reveal');
        if (btnTexts.length > 0) {
            targets = Array.from(btnTexts);
        } else {
            targets = [el];
        }

        // Initialize scrambler and cache clean original text
        targets.forEach(target => {
            if (!target.dataset.originalText) {
                target.dataset.originalText = target.textContent.trim();
            }
            target._scrambler = new TextScrambler(target);
        });

        // Trigger decryption sweep on mouse enter
        el.addEventListener('mouseenter', () => {
            targets.forEach(target => {
                const orig = target.dataset.originalText;
                target._scrambler.setText(orig);
            });
        });
    });

    // Use window.load to ensure all dimensions (fonts/content) are final for ticker width calculation
    window.addEventListener('load', () => {
        initTicker();
    });
});


