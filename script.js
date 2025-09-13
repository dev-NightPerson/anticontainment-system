document.addEventListener('DOMContentLoaded', function() {
    // --- Global Modal Background Effects Logic ---
    let openModalCount = 0;
    const globalModalBackgroundEffects = document.getElementById('modal-global-effects');

    const activateGlobalBackground = () => {
        openModalCount++;
        if (openModalCount === 1 && globalModalBackgroundEffects) {
            globalModalBackgroundEffects.classList.add('is-active');
        }
    };

    const deactivateGlobalBackground = () => {
        openModalCount--;
        if (openModalCount <= 0 && globalModalBackgroundEffects) {
            openModalCount = 0; // Ensure it doesn't go negative
            globalModalBackgroundEffects.classList.remove('is-active');
        }
    };

    // Function to create and animate light streaks for global background effects
    function createLightStreaks(numStreaks = 30) { // Default 30 streaks
        const streakContainer = document.querySelector('#modal-global-effects .streak-container');
        if (!streakContainer) return;

        // Clear existing streaks if any, to prevent duplicates on re-initialization
        streakContainer.innerHTML = '';

        for (let i = 0; i < numStreaks; i++) {
            const streak = document.createElement('div');
            streak.classList.add('light-streak');

            const randomAngle = Math.random() * 360; // Random angle for each streak (0-360 degrees)
            const randomDelay = Math.random() * 5; // Random start delay up to 5 seconds
            const randomDuration = Math.random() * 3 + 3; // Random duration between 3 and 6 seconds
            const randomWidth = Math.random() * 4 + 2; // Random width between 2px and 6px
            const randomHeight = Math.random() * 100 + 100; // Random height for length between 100vmin and 200vmin

            streak.style.setProperty('--random-angle', `${randomAngle}deg`);
            streak.style.setProperty('--streak-delay', `${randomDelay}s`);
            streak.style.setProperty('--streak-duration', `${randomDuration}s`);
            streak.style.setProperty('--streak-width', `${randomWidth}px`);
            streak.style.setProperty('--streak-height', `${randomHeight}vmin`);

            streakContainer.appendChild(streak);
        }
    }

    // Call createLightStreaks once on DOMContentLoaded
    createLightStreaks(30); // Set a specific number of streaks for index page

    // --- System Modal Logic ---
    const systemBtn = document.getElementById('system-btn');
    const systemModal = document.getElementById('system-modal');
    const systemModalCloseBtn = systemModal ? systemModal.querySelector('.modal-close-btn') : null;
    const systemModalOverlay = systemModal ? systemModal.querySelector('.modal-overlay') : null;
    const infoDisplay = document.getElementById('info-display');
    const panelLinks = systemModal ? systemModal.querySelectorAll('.panel-link') : [];

    const systemContentData = {
        'tokenomics-data': `
            <p><strong class="info-subtitle">$YSTEM Tokenomics — Expanded, Detailed Overview</strong></p>
            <p><strong class="info-subtitle">0) Core Supply & Key Addresses</strong></p>
            <p>Total Supply: 1,000,000,000 YSTEM (1 billion tokens)</p>
            <p>Contract Address: 2pABQvq9Ga8Y2TAAxZWYE2ebRBFsnfFHwQgWZAdapump</p>
            <p>Creator Wallet: D1RdGs1YqauADk8G3UpwwX6cvb6YoBHzWzU4edqtHVZS</p>
            <p>Rewards & Giveaways Wallet: 2dnNnkoGJeWkh8zm3urCcYYK26dDHyE8Cu18UHhwoBEc</p>

            <p><strong class="info-subtitle">1) Identity & Chain</strong></p>
            <p>Name / Ticker: YSTEM or $YSTEM (styled "SYSTEM" with the first S replaced by "$").</p>
            <p>Origin of Name: Created on October 2, 1999 (9-10-2 → NINETENTWO), which became the identity for the artist and now the project.</p>
            <p>Nature: A collaborative artist project, open to working with other creators, developers, and token holders.</p>
            <p>Network: Solana blockchain.</p>
            <p>Listings: $YSTEM (YSTEM) is live and trackable on Dexscreener and purchasable on pump.fun.</p>
            <p>Philosophy: Designed to raise awareness of the artist and the studio while building a crypto-driven collaborative community.</p>

            <p><strong class="info-subtitle">2) Initial Supply & Lock Structure</strong></p>
            <p>Initial Developer Buy-In: 9,102,000 YSTEM were initially purchased by the creator.</p>
            <p>This amount is subject to change via community buybacks and governance-based decisions.</p>
            <p>Locked Allocation:</p>
            <ul>
                <li>9,000,000 YSTEM locked until September 2, 2029.</li>
                <li>100,000 YSTEM locked on a monthly cycle, continuously re-locked unless community governance votes otherwise.</li>
            </ul>
            <p>These locks ensure long-term sustainability, commitment, and gradual release into circulation.</p>

            <p><strong class="info-subtitle">3) Circulating Supply Dynamics</strong></p>
            <p>Current circulation fluctuates based on:</p>
            <ul>
                <li>Trading activity (buys/sells on pump.fun and tracked through Dexscreener).</li>
                <li>Community voting decisions that may release or re-lock tokens.</li>
                <li>Buybacks initiated by the creator using revenue or community-approved treasury actions.</li>
            </ul>
            <p>The tokenomics are fluid yet governed, meaning supply responds to both organic market movement and structured community input.</p>

            <p><strong class="info-subtitle">4) Allocation Philosophy</strong></p>
            <p>The distribution of tokens is not rigidly pre-defined like some projects; instead, it balances creative flexibility with trust-building transparency:</p>
            <ul>
                <li>Creator Wallet – serves as the origin but is deliberately restrained by long-term locks.</li>
                <li>Rewards & Giveaways Wallet – fuels community incentives, contests, collaborations, and token-based growth strategies.</li>
                <li>Open Circulation – the majority of liquidity remains community-controlled through exchanges/swaps.</li>
            </ul>

            <p><strong class="info-subtitle">5) Price Influence & Valuation</strong></p>
            <p>Dual Market Cap Dependency:</p>
            <ul>
                <li>The value of YSTEM is directly influenced by both Solana's market cap (as it's the base pair for swaps) and YSTEM's own market cap trajectory.</li>
            </ul>
            <p>Price Discovery:</p>
            <ul>
                <li>Early stages are driven heavily by pump.fun activity and community-driven momentum.</li>
                <li>Longer-term valuation stabilizes as more DEX listings, integrations, and use cases develop.</li>
            </ul>

            <p><strong class="info-subtitle">6) Governance & Community Control</strong></p>
            <p>Voting Mechanism:</p>
            <ul>
                <li>Token holders can propose or vote on major decisions (e.g., unlocking tokens, initiating development spends, approving marketing campaigns).</li>
                <li>Creator honors this system by publicly announcing governance votes and executing the majority choice.</li>
            </ul>
            <p>Participation:</p>
            <ul>
                <li>All governance events are tied to transparent wallet actions, ensuring verifiable outcomes.</li>
            </ul>

            <p><strong class="info-subtitle">7) Rewards & Incentives (Non-SSS Specific)</strong></p>
            <ul>
                <li>Community Rewards: Distributed via the Rewards & Giveaways wallet.</li>
                <li>Engagement Incentives: Holders and contributors can benefit through collaborations, creative contributions, and support of project development.</li>
                <li>Cross-Creative Expansion: As collaborations increase, token utility grows across multiple studios and projects.</li>
            </ul>

            <p><strong class="info-subtitle">8) Longevity & Locks</strong></p>
            <ul>
                <li>9,000,000 YSTEM locked until 2029 represents a 10-year horizon of trust and stability.</li>
                <li>This long lock acts as a signal of dedication by the creator to prevent early dumps and to keep liquidity secure.</li>
                <li>The monthly 100,000 lock cycle provides a short-term safety mechanism, ensuring tokens can't be liquidated without community oversight.</li>
            </ul>

            <p><strong class="info-subtitle">9) Utility Beyond Holding</strong></p>
            <ul>
                <li>Studio Integration: YSTEM is the token of NINETENTWO's Anticontainment System studio.</li>
                <li>Collaborative Use Cases: Expanding into artist partnerships, studio tools, community events, and future token-driven creative ecosystems.</li>
                <li>Identity & Branding: YSTEM doubles as a creative and financial instrument, tying together art, community, and blockchain infrastructure.</li>
            </ul>

            <p><strong class="info-subtitle">10) Summary</strong></p>
            <p>YSTEM's tokenomics are built to balance creative freedom, community governance, and sustainable growth. The structure — with strong token locks, transparent wallets, flexible allocation, and governance-led decision-making — ensures:</p>
            <ul>
                <li>Trust: Long-term commitment visible on-chain.</li>
                <li>Utility: Integration with the studio and collaborations.</li>
                <li>Growth: Community-driven expansion through liquidity, voting, and creative engagement.</li>
                <li>Identity: Rooted in the artist's origin story, styled through the "$YSTEM" branding, and branching outward like the Y-symbol of growth and expansion.</li>
            </ul>
        `,
        'satsurge-data': `
            <p><strong class="info-subtitle">System Surge Saturday – Knowledge Base</strong></p>
            <p>System Surge Saturday is the weekly livestream and community event for YSTEM. Every Saturday, the community comes together for games, competitions, giveaways, and rewards that hype the token, reward holders, and strengthen the collaborative system.</p>
            <p>There are five main parts:</p>
            
            <p><strong class="info-subtitle">1. Random Holder Airdrop</strong></p>
            <ul>
                <li><strong>Eligibility:</strong>
                    <ul>
                        <li>Week 1 → Top 20 holders (snapshot taken Friday night before System Surge Saturday).</li>
                        <li>Future Weeks → Expanded eligibility (anyone holding YSTEM).</li>
                    </ul>
                </li>
                <li><strong>Selection:</strong> One wallet is chosen at random from the eligible pool.</li>
                <li><strong>Reward:</strong> Tokens are sent indirectly from the Rewards & Giveaways wallet, not the Creator/Developer wallet.</li>
                <li><strong>Purpose:</strong> Incentivizes holding, creates excitement, and gives everyone a fair chance regardless of wallet size.</li>
            </ul>
            
            <p><strong class="info-subtitle">2. Shill-to-Win (#ShillToWin)</strong></p>
            <ul>
                <li><strong>Platform:</strong> X (Twitter).</li>
                <li><strong>Mechanics:</strong>
                    <ul>
                        <li>Each week, a specific post is announced at the start of the week.</li>
                        <li>To qualify, participants must repost and comment on the post with the hashtag #ShillToWin.</li>
                    </ul>
                </li>
                <li><strong>Winner:</strong> On System Surge Saturday, one X account is chosen at random from the qualified entries. If selected, the winner will be contacted via DM on X.com with details of their winnings.</li>
                <li><strong>Reward:</strong> Tokens from the Rewards & Giveaways wallet.</li>
                <li><strong>Purpose:</strong> Boosts YSTEM's visibility on social platforms, drives engagement, and strengthens community presence.</li>
            </ul>
            
            <p><strong class="info-subtitle">3. Market Cap Trivia</strong></p>
            <ul>
                <li><strong>Trigger:</strong> At specific market cap milestones (e.g., $20K, $40K, $60K).</li>
                <li><strong>Mechanics:</strong> A trivia question about YSTEM, NINETENTWO, ANTICONTAINMENT SYSTEM, or crypto culture is asked live. First correct answer in the livestream chat wins.</li>
                <li><strong>If No Livestream:</strong> If market cap targets are reached when a livestream is not active, the trivia for all targets hit will be conducted at the start of the next livestream.</li>
                <li><strong>Reward:</strong> Each trivia target rewards 500,000 tokens sent indirectly from the Rewards & Giveaways wallet, not the Creator/Developer wallet.</li>
                <li><strong>Purpose:</strong> Makes hitting new market caps a celebratory moment and rewards the most engaged community members.</li>
            </ul>
            
            <p><strong class="info-subtitle">4. Guess the Buy Back Price Raffle</strong></p>
            <ul>
                <li><strong>Mechanics:</strong> Community members can enter by sending 0.05 SOL to the designated raffle wallet. Each entry corresponds to a guess for the buy-back price.</li>
                <li><strong>Rules:</strong>
                    <ul>
                        <li>Any wallet that sends the 0.05 SOL must also direct message NINETENTWO (on livestream chat or X.com, not Telegram) with the wallet address used. This connects the wallet to a social profile, ensuring winners can be notified and entries are verifiable.</li>
                        <li>The approximate time of the livestream on Saturdays will be announced in the $YSTEM ANTICONTAINMENT SYSTEM X.com community. Participants must attend to make their guess.</li>
                        <li>The total SOL pooled throughout the week will be used to buy YSTEM live on stream. Wallet owners who sent their 0.05 SOL before the cut-off will then guess the amount of YSTEM the full pool will purchase.</li>
                        <li>Price is Right rules: closest guess in the livestream chat wins all the YSTEM purchased when the swap is made.</li>
                    </ul>
                </li>
                <li><strong>Reward:</strong> The full amount of YSTEM purchased during the buy-back swap.</li>
                <li><strong>Purpose:</strong> Adds a competitive raffle-style game, ties directly into token liquidity, and creates exciting livestream moments.</li>
            </ul>
            
            <p><strong class="info-subtitle">5. Top Contributor Recognition</strong></p>
            <ul>
                <li><strong>Measurement:</strong> Snapshot taken each Friday before System Surge Saturday to identify the top contributor.</li>
                <li><strong>Condition:</strong> If the same wallet is the top contributor at the beginning of the second consecutive week, they receive a special reward.</li>
                <li><strong>Reward:</strong> A reward or amount of YSTEM determined by the current market cap, plus potential shoutouts, future collab invites, or creative perks.</li>
                <li><strong>Purpose:</strong> Encourages sustained contribution to the project and rewards long-term dedication with both tokens and cultural recognition.</li>
            </ul>
            
            <p><strong class="info-subtitle">Summary of the 5 Parts</strong></p>
            <ol>
                <li>Random Holder Airdrop → Luck-based, inclusive.</li>
                <li>Shill-to-Win (#ShillToWin) → Social hype, DM contact for winners.</li>
                <li>Market Cap Trivia → 500K token rewards per milestone, even if delayed to the next stream.</li>
                <li>Guess the Buy Back Price Raffle → 0.05 SOL entry, social DM rule, Price is Right guessing, winner gets the live-purchased YSTEM.</li>
                <li>Top Contributor Recognition → Rewards scaled by market cap, plus shoutouts and creative perks.</li>
            </ol>
        `,
        'roadmap-data': `
            <p><strong class="info-subtitle">$YSTEM Draft Roadmap (Work-in-Progress)</strong></p>
            <p><strong class="info-subtitle">Phase 1: Foundation & Awareness (2024–2025)</strong></p>
            <p><strong>Token Launch & Locks:</strong></p>
            <ul>
                <li>9,102,000 tokens purchased by the creator.</li>
                <li>9,000,000 locked until September 2, 2029.</li>
                <li>100,000 locked & re-locked monthly (community vote may decide otherwise).</li>
                <li>2,000 left unlocked for immediate liquidity.</li>
            </ul>
            <p><strong>Listings & Visibility:</strong></p>
            <ul>
                <li>Launch on pump.fun.</li>
                <li>Listed and trackable on Dexscreener.</li>
                <li>Ongoing push to be listed on more DEXs and swaps.</li>
            </ul>
            <p><strong>Community Identity:</strong></p>
            <ul>
                <li>Establish $YSTEM as the creative token of NINETENTWO's studio.</li>
                <li>Kick off System Surge Saturday events to build weekly community rituals.</li>
            </ul>
            <p><strong>Brand Development:</strong></p>
            <ul>
                <li>Position ANTICONTAINMENT SYSTEM as the parent creative studio.</li>
                <li>Solidify visual identity: $YSTEM lettering, branching Y, bronze/circuit themes.</li>
            </ul>

            <p><strong class="info-subtitle">Phase 2: Growth & Creative Expansion (2025–2026)</strong></p>
            <p><strong>Community Building:</strong></p>
            <ul>
                <li>Expand Telegram group, X.com presence, and livestream engagement.</li>
                <li>Shill-to-Win and trivia contests to incentivize participation.</li>
                <li>Begin NFT meme drops tied to $YSTEM branding and lore.</li>
            </ul>
            <p><strong>Collaborations:</strong></p>
            <ul>
                <li>Partnerships with artists and devs who align with ANTICONTAINMENT values.</li>
                <li>$YSTEM-based projects (community-built apps, art, or games).</li>
            </ul>
            <p><strong>Exposure Strategy:</strong></p>
            <ul>
                <li>Daily meme & short video content.</li>
                <li>Push $YSTEM as a studio token — recognition in art/crypto crossovers.</li>
            </ul>

            <p><strong class="info-subtitle">Phase 3: Consolidation & Ecosystem (2026–2027)</strong></p>
            <p><strong>Studio Development:</strong></p>
            <ul>
                <li>Move toward the 4-year consolidation plan: unify multiple artist studios and workshops under the ANTICONTAINMENT SYSTEM brand.</li>
                <li>Tokenization used for governance, creative funding, and collaboration.</li>
            </ul>
            <p><strong>Ecosystem Features:</strong></p>
            <ul>
                <li>Community voting on development/marketing token usage.</li>
                <li>Explore staking models or creative contribution rewards (optional).</li>
                <li>Further NFT and creative project tie-ins.</li>
            </ul>
            <p><strong>DEX/Swap Expansion:</strong></p>
            <ul>
                <li>Ongoing effort to be present across multiple platforms for liquidity.</li>
            </ul>

            <p><strong class="info-subtitle">Phase 4: Legacy & Unlock Horizon (2028–2029)</strong></p>
            <p><strong>Community Maturity:</strong></p>
            <ul>
                <li>Strengthen governance framework (votes, proposals).</li>
                <li>Large-scale collaborations and showcases tied to ANTICONTAINMENT SYSTEM.</li>
            </ul>
            <p><strong>Creative Legacy:</strong></p>
            <ul>
                <li>Full integration of all artist studios under one roof.</li>
                <li>Establish $YSTEM as not just a token but a creative network identity.</li>
            </ul>
            <p><strong>Token Unlock Event:</strong></p>
            <ul>
                <li>On September 2, 2029, the 9,000,000 locked tokens unlock.</li>
                <li>Community decisions will guide their role (continued lock, strategic use, redistribution, etc.).</li>
            </ul>
            <p><strong class="info-subtitle">Long-Term Vision</strong></p>
            <p>$YSTEM grows like its branching Y — always splitting into new stems, nodes, and directions.</p>
            <p>It's both a studio token and a living creative organism, sustained by its community, locked foundation, and collaborations.</p>
            <p>This document is not a whitepaper and is subject to change.</p>
        `,
        'presskit-data': `
            <p><strong class="info-subtitle">Press Kit:</strong> Access our official press kit for media inquiries and branding assets.</p>
            <p>Includes high-resolution logos, detailed project descriptions, and media guidelines.</p>
            <p>Available for download soon via the 'Downloads' section in our Media column.</p>
            <p>For immediate inquiries, please contact us on X.</p>
        `,
        'snapshot-data': `
            <img src="https://anticontainmentsystem.com/image/Rsnapshot.png" alt="Snapshot Image">
        `
    };

    const openSystemModal = (targetContentId = null) => {
        systemModal.classList.add('is-open');
        activateGlobalBackground(); // Activate global background
        
        let targetLink = null;
        if (targetContentId) {
            targetLink = systemModal.querySelector(`.panel-link[data-content-id="${targetContentId}"]`);
        }

        // If a valid target link is found, click it. Otherwise, click the first link as default.
        if (targetLink) {
            targetLink.click();
        } else if (infoDisplay && panelLinks.length > 0) {
            // Simulate click on the first link to load default content
            panelLinks[0].click(); 
        }
    };
    const closeSystemModal = () => {
        systemModal.classList.remove('is-open');
        deactivateGlobalBackground(); // Deactivate global background
    };

    if (systemBtn) {
        systemBtn.addEventListener('click', () => openSystemModal());
    }
    if (systemModalCloseBtn) {
        systemModalCloseBtn.addEventListener('click', closeSystemModal);
    }
    if (systemModalOverlay) {
        systemModalOverlay.addEventListener('click', closeSystemModal);
    }

    panelLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active class from all links
            panelLinks.forEach(p => p.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');

            const contentId = link.dataset.contentId;
            if (infoDisplay && systemContentData[contentId]) {
                infoDisplay.innerHTML = systemContentData[contentId];

                // If the snapshot data is loaded, add a click listener to the image
                if (contentId === 'snapshot-data') {
                    const snapshotImage = infoDisplay.querySelector('img');
                    if (snapshotImage) {
                        snapshotImage.style.cursor = 'zoom-in'; // Indicate it's clickable
                        snapshotImage.addEventListener('click', () => {
                            openImageLightbox(snapshotImage.src);
                        });
                    }
                }
            }
        });
    });

    // Close system modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && systemModal && systemModal.classList.contains('is-open')) {
            closeSystemModal();
        }
    });

    // --- Footer Link to System Modal Logic ---
    const pressKitFooterLink = document.getElementById('press-kit-footer-link');
    if (pressKitFooterLink) {
        pressKitFooterLink.addEventListener('click', (e) => {
            e.preventDefault();
            openSystemModal('presskit-data');
        });
    }

    // --- Image Lightbox Logic ---
    const imageLightbox = document.getElementById('image-lightbox');
    const imageLightboxOverlay = imageLightbox ? imageLightbox.querySelector('.image-lightbox-overlay') : null;
    const imageLightboxImg = imageLightbox ? imageLightbox.querySelector('.image-lightbox-img') : null;

    const openImageLightbox = (src) => {
        if (imageLightboxImg) {
            imageLightboxImg.src = src;
            imageLightbox.classList.add('is-open');
            activateGlobalBackground(); // Activate global background
        }
    };

    const closeImageLightbox = () => {
        if (imageLightbox) {
            imageLightbox.classList.remove('is-open');
            // Clear the image source to prevent content flash on next open
            if (imageLightboxImg) {
                imageLightboxImg.src = '';
            }
            deactivateGlobalBackground(); // Deactivate global background
        }
    };

    // Attach click listener to the main lightbox container to handle clicks outside the image
    if (imageLightbox) {
        imageLightbox.addEventListener('click', (event) => {
            // Close if the click target is anything but the image itself
            // This allows clicking on the overlay, or the 'padding' area within image-lightbox-content
            // but not on the image element itself.
            if (event.target !== imageLightboxImg) {
                closeImageLightbox();
            }
        });
    }

    // Close image lightbox with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && imageLightbox && imageLightbox.classList.contains('is-open')) {
            closeImageLightbox();
        }
    });

    // --- Updates Modal Logic (modified to interact with System Modal) ---
    const updatesBtn = document.getElementById('updates-btn'); // Now inside system modal
    const updatesModal = document.getElementById('updates-modal');
    
    if (updatesBtn && updatesModal) {
        const updatesModalCloseBtn = updatesModal.querySelector('.modal-close-btn');
        const updatesModalOverlay = updatesModal.querySelector('.modal-overlay');

        const openUpdatesModal = () => {
            updatesModal.classList.add('is-open');
            activateGlobalBackground(); // Activate global background
        };
        const closeUpdatesModal = () => {
            updatesModal.classList.remove('is-open');
            deactivateGlobalBackground(); // Deactivate global background
        };

        updatesBtn.addEventListener('click', () => {
            if (systemModal && systemModal.classList.contains('is-open')) {
                closeSystemModal(); // Close system modal first
            }
            if (newModal && newModal.classList.contains('is-open')) { // Close new modal if open
                closeNewModal();
            }
            openUpdatesModal(); // Then open updates modal
        });
        updatesModalCloseBtn.addEventListener('click', closeUpdatesModal);
        updatesModalOverlay.addEventListener('click', closeUpdatesModal);

        // Close updates modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && updatesModal.classList.contains('is-open')) {
                closeUpdatesModal();
            }
        });
    }

    // --- Collabs Button Logic (modified to interact with System Modal) ---
    const collabsBtn = document.getElementById('collabs-btn'); // Now inside system modal
    if (collabsBtn) {
        collabsBtn.addEventListener('click', () => {
            // Before navigating, ensure all modals on THIS page are closed and reset background counter
            if (systemModal && systemModal.classList.contains('is-open')) {
                closeSystemModal();
            }
            if (updatesModal && updatesModal.classList.contains('is-open')) {
                closeUpdatesModal();
            }
            if (newModal && newModal.classList.contains('is-open')) {
                closeNewModal();
            }
            if (imageLightbox && imageLightbox.classList.contains('is-open')) {
                closeImageLightbox();
            }
            // Reset modal count for next page load
            openModalCount = 0; 
            if (globalModalBackgroundEffects) {
                globalModalBackgroundEffects.classList.remove('is-active');
            }
            window.location.href = 'collabs.html'; // Then navigate
        });
    }

    // --- New Modal Logic ---
    const newModalBtn = document.getElementById('new-modal-btn');
    const newModal = document.getElementById('new-modal');

    if (newModalBtn && newModal) {
        const newModalCloseBtn = newModal.querySelector('.modal-close-btn');
        const newModalOverlay = newModal.querySelector('.modal-overlay');

        const openNewModal = () => {
            newModal.classList.add('is-open');
            activateGlobalBackground(); // Activate global background
        };
        const closeNewModal = () => {
            newModal.classList.remove('is-open');
            deactivateGlobalBackground(); // Deactivate global background
        };

        newModalBtn.addEventListener('click', () => {
            // Close other modals if open
            if (systemModal && systemModal.classList.contains('is-open')) {
                closeSystemModal();
            }
            if (updatesModal && updatesModal.classList.contains('is-open')) {
                closeUpdatesModal();
            }
            openNewModal(); // Then open the new modal
        });

        newModalCloseBtn.addEventListener('click', closeNewModal);
        newModalOverlay.addEventListener('click', closeNewModal);

        // Close new modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && newModal.classList.contains('is-open')) {
                closeNewModal();
            }
        });
    }

    // Copy CA button
    const copyBtn = document.getElementById('copy-ca-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const ca = '2pABQvq9Ga8Y2TAAxZWYE2ebRBFsnfFHwQgWZAdapump';
            navigator.clipboard.writeText(ca).then(() => {
                const feedback = document.getElementById('copy-feedback');
                feedback.classList.add('show');
                setTimeout(() => {
                    feedback.classList.remove('show');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    }

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Header image click animation
    const headerImage = document.querySelector('.header-image');
    if (headerImage) {
        headerImage.addEventListener('click', function() {
            if (this.classList.contains('animating')) return; // Prevent re-triggering during animation

            this.classList.add('animating');

            // Reset animation by removing and re-adding the class
            this.classList.remove('animate-zoom-fade');
            void this.offsetWidth; // Trigger reflow
            this.classList.add('animate-zoom-fade');

            this.addEventListener('animationend', () => {
                this.classList.remove('animating');
            }, { once: true });
        });
    }
    
    // Cursor trail effect - Enhanced for cross-browser compatibility
    const trailContainer = document.getElementById('cursor-trail-container');
    if (trailContainer) {
        let canCreateParticle = true;
        
        const createParticle = (x, y) => {
            const particle = document.createElement('div');
            particle.className = 'trail-particle';
            
            // Use transform for positioning to ensure hardware acceleration
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.position = 'absolute';
            
            const size = Math.random() * 8 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${Math.random() > 0.5 ? size : size * (Math.random() * 1.5 + 0.5)}px`;
            
            const colors = ['#cd7f32', '#b8860b', '#daa520', '#e6a861'];
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.opacity = '0.9';
            
            // Set CSS custom properties for drift
            particle.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 2}`);
            particle.style.setProperty('--drift-y', `${(Math.random() - 0.5) * 2}`);
            
            trailContainer.appendChild(particle);
            
            // Force reflow to ensure animation starts
            void particle.offsetWidth;
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 500);
        };
        
        // Enhanced event listener with better browser support
        const handleMouseMove = (e) => {
            if (canCreateParticle) {
                createParticle(e.clientX, e.clientY);
                canCreateParticle = false;
                
                setTimeout(() => {
                    canCreateParticle = true;
                }, 50);
            }
        };
        
        // Add event listener with passive option for better performance
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        
        // Ensure container exists and is visible
        trailContainer.style.pointerEvents = 'none';
        trailContainer.style.position = 'fixed';
        trailContainer.style.zIndex = '9999';
    }
    
    // Create random brass lines
    function createBrassLines() {
        const containers = document.querySelectorAll('.brass-lines-container');
        containers.forEach(container => {
            const numLines = 15;
            
            for (let i = 0; i < numLines; i++) {
                const line = document.createElement('div');
                line.classList.add('brass-line');
                
                // Random direction and type
                const isHorizontal = Math.random() > 0.5;
                const isReverse = Math.random() > 0.5;
                
                if (isHorizontal) {
                    line.classList.add('horizontal');
                    line.style.setProperty('--length', Math.random() * 200 + 100 + 'px');
                    line.style.setProperty('--position', Math.random() * 100 + '%');
                    line.style.setProperty('--duration', Math.random() * 10 + 5 + 's');
                    
                    if (isReverse) {
                        line.style.animationName = 'moveHorizontalReverse';
                        line.style.right = '-250px';
                        line.style.left = 'auto';
                    }
                } else {
                    line.classList.add('vertical');
                    line.style.setProperty('--length', Math.random() * 200 + 100 + 'px');
                    line.style.setProperty('--position', Math.random() * 100 + '%');
                    line.style.setProperty('--duration', Math.random() * 10 + 5 + 's');
                    
                    if (isReverse) {
                        line.style.animationName = 'moveVerticalReverse';
                        line.style.bottom = '-250px';
                        line.style.top = 'auto';
                    }
                }
                
                // Random opacity
                line.style.opacity = Math.random() * 0.4 + 0.1;
                
                // Random thickness
                line.style.height = isHorizontal ? (Math.random() * 20 + 20) + 'px' : line.style.height;
                line.style.width = !isHorizontal ? (Math.random() * 20 + 20) + 'px' : line.style.width;
                
                container.appendChild(line);
            }
        });
    }
    
    createBrassLines();
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe footer columns for staggered animation
    const footerColumns = document.querySelectorAll('.footer-column');
    footerColumns.forEach(column => {
        observer.observe(column);
    });
});

// Add ripple animation keyframes via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
