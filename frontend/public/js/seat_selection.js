// Seat selection logic shared by seat selection and confirmation pages.
// No Logic for the confirming the seats yet
(() => {
    const seatGrid = document.getElementById("seatGrid");
    if (!seatGrid) {
        return;
    }

    const selectedCount = document.getElementById("selectedCount");
    const clearBtn = document.getElementById("clearBtn");
    const notice = document.getElementById("notice");
    const anonymousToggle = document.getElementById("anonymousToggle");

    const seatLayout = [
        ["A1", "A2", null, "A3", "A4"],
        ["B1", "B2", null, "B3", "B4"],
        [null, null, null, null, null],
        ["C1", "C2", null, "C3", "C4"],
        ["D1", "D2", null, "D3", "D4"],
    ];

    const seatData = {
        A1: { status: "available" },
        A2: { status: "taken", name: "Anonymous" },
        A3: { status: "available" },
        A4: { status: "available" },
        B1: { status: "available" },
        B2: { status: "taken", name: "Kien Ong" },
        B3: { status: "available" },
        B4: { status: "available" },
        C1: { status: "available" },
        C2: { status: "available" },
        C3: { status: "taken", name: "Kien Ong" },
        C4: { status: "available" },
        D1: { status: "available" },
        D2: { status: "available" },
        D3: { status: "available" },
        D4: { status: "taken", name: "Anonymous" },
    };

    const selectedSeats = new Set();
    const profilePage = "view_other_profile.html";

    function isAnonymousName(name) {
        return !name || name.trim().toLowerCase() === "anonymous";
    }

    function renderSeats() {
        seatGrid.innerHTML = "";
        const columnCount = Math.max(...seatLayout.map((row) => row.length));
        seatGrid.style.gridTemplateColumns = `repeat(${columnCount}, minmax(70px, 1fr))`;

        seatLayout.forEach((row) => {
            row.forEach((seatId) => {
                if (!seatId) {
                    const spacer = document.createElement("div");
                    spacer.className = "seat space";
                    spacer.setAttribute("aria-hidden", "true");
                    seatGrid.appendChild(spacer);
                    return;
                }

                const seat = seatData[seatId] || { status: "available" };
                const button = document.createElement("button");
                button.type = "button";
                button.className = `seat ${seat.status}`;
                button.dataset.seatId = seatId;

                const label = document.createElement("div");
                label.textContent = seatId;
                button.appendChild(label);

                if (seat.status === "taken") {
                    const name = document.createElement("span");
                    name.className = "seat-name";
                    name.textContent = seat.name || "Anonymous";
                    button.appendChild(name);

                    if (!isAnonymousName(seat.name)) {
                        button.addEventListener("click", () => {
                            window.location.href = profilePage;
                        });
                    }
                }

                if (seat.status === "available") {
                    button.addEventListener("click", () => toggleSeat(seatId));
                }

                seatGrid.appendChild(button);
            });
        });

        updateSummary();
    }

    function toggleSeat(id) {
        if (notice) {
            notice.textContent = "";
        }

        if (selectedSeats.has(id)) {
            selectedSeats.delete(id);
        } else {
            selectedSeats.add(id);
        }

        updateSeatStyles();
        updateSummary();
    }

    function updateSeatStyles() {
        document.querySelectorAll(".seat.available").forEach((seatEl) => {
            const id = seatEl.dataset.seatId;
            seatEl.classList.toggle("selected", selectedSeats.has(id));
        });
    }

    function updateSummary() {
        if (selectedCount) {
            selectedCount.textContent = String(selectedSeats.size);
        }

        return;
    }

    function clearSelection() {
        selectedSeats.clear();
        updateSeatStyles();
        updateSummary();
        if (notice) {
            notice.textContent = "";
        }
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", clearSelection);
    }

    renderSeats();
})();
