// =======================================================
// CONSTANTS
// =======================================================
const SEA_MODES = new Set([
    "SEA - LCL IMPORT",
    "SEA - LCL EXPORT",
    "SEA - FCL EXPORT",
    "SEA - FCL IMPORT"
]);

const AIR_MODES = new Set([
    "AIR - IMPORT",
    "AIR - EXPORT",
    "COURIER - Import",
    "COURIER - Export"
]);

// Global flag to prevent infinite loops
let is_calculating = false;

// =======================================================
// QUOTATION ITEM LOGIC
// =======================================================
frappe.ui.form.on("Quotation Item", {

    form_render(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        toggle_custom_total_edit(frm, row);
    },

    items_add(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        // Initialize with defaults
        row.custom_formula = 0;
        row.custom_total = 0;
        row.custom_total_value = 0;
        row.custom_total_in_inr = 0;
        row.rate = 0;
        row.price_list_rate = 0;

        frm.refresh_field("items");
        
        setTimeout(() => toggle_custom_total_edit(frm, row), 100);
    },

    item_code(frm, cdt, cdn) {
        // Reset rate when item is selected - defeat ERPNext price fetch
        let row = locals[cdt][cdn];
        row.rate = 0;
        row.price_list_rate = 0;
        
        frm.refresh_field("items");

        setTimeout(() => {
            row.rate = 0;
            row.price_list_rate = 0;
            frm.refresh_field("items");
        }, 300);
    },

    // ⚡ CRITICAL: Trigger on custom_custom_rate change
    custom_custom_rate(frm, cdt, cdn) {
        if (is_calculating) return;
        calculate_row_immediate(frm, cdt, cdn);
    },

    // ⚡ CRITICAL: Trigger on exchange_rate change
    custom_exchange_rate(frm, cdt, cdn) {
        if (is_calculating) return;
        calculate_row_immediate(frm, cdt, cdn);
    },

    // ⚡ CRITICAL: Trigger on formula checkbox change
    custom_formula(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        toggle_custom_total_edit(frm, row);
        
        setTimeout(() => {
            if (!is_calculating) {
                calculate_row_immediate(frm, cdt, cdn);
            }
        }, 100);
    },

    // ⚡ CRITICAL: Trigger on manual total change
    custom_total(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        // Only recalculate if in manual mode
        if (!row.custom_formula && !is_calculating) {
            calculate_row_immediate(frm, cdt, cdn);
        }
    },

    // Ensure rate changes propagate to amount
    rate(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        calculate_item_amount(frm, row);
    }
});

// =======================================================
// GRID FIELD CONTROL
// =======================================================
function toggle_custom_total_edit(frm, row) {
    const grid_row = frm.fields_dict.items.grid.grid_rows_by_docname[row.name];
    if (!grid_row) return;

    // Editable only in manual mode (formula unchecked)
    const editable = !row.custom_formula;
    grid_row.toggle_editable("custom_total", editable);
}

// =======================================================
// DIMENSION TABLE EVENTS
// =======================================================
frappe.ui.form.on("Quotation Dimension Detail", {

    number_of_boxes(frm, cdt, cdn) {
        calculate_dimension_row(frm, locals[cdt][cdn]);
    },

    length_cm(frm, cdt, cdn) {
        calculate_dimension_row(frm, locals[cdt][cdn]);
    },

    breadth_cm(frm, cdt, cdn) {
        calculate_dimension_row(frm, locals[cdt][cdn]);
    },

    dim_height_cm(frm, cdt, cdn) {
        calculate_dimension_row(frm, locals[cdt][cdn]);
    },

    weight_kg(frm, cdt, cdn) {
        calculate_dimension_row(frm, locals[cdt][cdn]);
    }
});

// =======================================================
// DIMENSION CALCULATION
// =======================================================
function calculate_dimension_row(frm, row) {
    let L = flt(row.length_cm || 0);
    let B = flt(row.breadth_cm || 0);
    let H = flt(row.dim_height_cm || 0);
    let boxes = flt(row.number_of_boxes || 1);

    let mode = (frm.doc.custom_mode || "").toUpperCase();
    let divisor = mode.startsWith("COURIER") ? 5000 : 6000;

    row.custom_cbm = flt((L * B * H / 1000000) * boxes, 6);
    row.volume_weight = flt((L * B * H / divisor) * boxes, 3);

    frm.refresh_field("custom_dimension_details");
    
    setTimeout(() => update_dimension_totals(frm), 100);
}

// =======================================================
// DIMENSION TOTALS
// =======================================================
function update_dimension_totals(frm) {
    let total_cbm = 0,
        total_weight = 0,
        total_boxes = 0,
        total_volume_weight = 0;

    (frm.doc.custom_dimension_details || []).forEach(row => {
        total_cbm += flt(row.custom_cbm || 0);
        total_weight += flt(row.weight_kg || 0);
        total_boxes += flt(row.number_of_boxes || 0);
        total_volume_weight += flt(row.volume_weight || 0);
    });

    total_cbm = flt(total_cbm, 2);
    total_weight = flt(total_weight, 2);
    total_volume_weight = flt(total_volume_weight, 2);

    frm.doc.custom_total_no_of_boxes = total_boxes;
    frm.doc.custom_total_cbm = total_cbm;
    frm.doc.custom_total_weight = total_weight;
    frm.doc.custom_total_volume_weight = total_volume_weight;
    frm.doc.custom_totals_in_cbm = total_cbm;
    frm.doc.custom_gross_weight = total_weight;

    frm.refresh_fields([
        "custom_total_no_of_boxes",
        "custom_total_cbm", 
        "custom_total_weight",
        "custom_total_volume_weight",
        "custom_totals_in_cbm",
        "custom_gross_weight"
    ]);

    setTimeout(() => recalc_all_items(frm), 100);
}

// =======================================================
// QUOTATION FIELD EVENTS
// =======================================================
frappe.ui.form.on("Quotation", {

    refresh(frm) {
        setTimeout(() => {
            (frm.doc.items || []).forEach(row => {
                toggle_custom_total_edit(frm, row);
            });
        }, 200);
    },

    custom_mode(frm) {
        recalc_all_items(frm);
    },

    custom_total_cbm(frm) {
        recalc_all_items(frm);
    },

    custom_total_weight(frm) {
        recalc_all_items(frm);
    },

    custom_total_volume_weight(frm) {
        recalc_all_items(frm);
    },

    custom_totals_in_cbm(frm) {
        frm.doc.custom_total_cbm = flt(frm.doc.custom_totals_in_cbm || 0);
        frm.refresh_field("custom_total_cbm");
        recalc_all_items(frm);
    },

    custom_gross_weight(frm) {
        frm.doc.custom_total_weight = flt(frm.doc.custom_gross_weight || 0);
        frm.refresh_field("custom_total_weight");
        recalc_all_items(frm);
    }
});

// =======================================================
// RECALCULATE ALL ITEMS
// =======================================================
function recalc_all_items(frm) {
    (frm.doc.items || []).forEach(row => {
        calculate_row(frm, row);
    });
    
    frm.refresh_field("items");
    calculate_totals(frm);
}

// =======================================================
// DETERMINE TOTAL SOURCE
// =======================================================
function get_effective_totals(frm) {
    const has_dimensions = (frm.doc.custom_dimension_details || []).some(r =>
        flt(r.custom_cbm || 0) > 0 || flt(r.weight_kg || 0) > 0
    );

    if (has_dimensions) {
        return {
            cbm: flt(frm.doc.custom_total_cbm || 0),
            weight: flt(frm.doc.custom_total_weight || 0),
            volume_weight: flt(frm.doc.custom_total_volume_weight || 0)
        };
    }

    return {
        cbm: flt(frm.doc.custom_totals_in_cbm || 0),
        weight: flt(frm.doc.custom_gross_weight || 0),
        volume_weight: flt(frm.doc.custom_total_volume_weight || 0)
    };
}

// =======================================================
// IMMEDIATE CALCULATION (FOR FIELD TRIGGERS)
// =======================================================
function calculate_row_immediate(frm, cdt, cdn) {
    is_calculating = true;
    
    let row = locals[cdt][cdn];
    calculate_row(frm, row);
    
    frm.refresh_field("items");
    
    setTimeout(() => {
        calculate_totals(frm);
        is_calculating = false;
    }, 100);
}

// =======================================================
// CENTRALIZED CALCULATION FUNCTION
// =======================================================
function calculate_row(frm, row) {
    
    let user_rate = flt(row.custom_custom_rate || 0);
    let exchange_rate = flt(row.custom_exchange_rate || 0);
    let custom_total = 0;

    // Must have exchange rate (allow 0 but not null/undefined)
    if (!exchange_rate && exchange_rate !== 0) {
        clear_row_values(frm, row);
        return;
    }

    // =============================
    // FORMULA MODE
    // =============================
    if (row.custom_formula) {
        
        if (!user_rate) {
            clear_row_values(frm, row);
            return;
        }

        let totals = get_effective_totals(frm);
        let mode = (frm.doc.custom_mode || "").toUpperCase();

        if (SEA_MODES.has(mode)) {
            custom_total = flt(totals.cbm * user_rate, 2);
        } 
        else if (AIR_MODES.has(mode)) {
            let chargeable_weight = Math.max(totals.weight, totals.volume_weight);
            custom_total = flt(chargeable_weight * user_rate, 2);
        } 
        else {
            clear_row_values(frm, row);
            return;
        }
    }
    // =============================
    // MANUAL MODE
    // =============================
    else {
        
        // In manual mode: custom_total = custom_rate
        if (!user_rate) {
            clear_row_values(frm, row);
            return;
        }
        
        // ⚡ KEY FIX: Always assign custom_rate to custom_total in manual mode
        custom_total = user_rate;
    }

    // =============================
    // FINAL CONVERSION & UPDATE
    // =============================
    let total_value = flt(custom_total * exchange_rate, 2);

    // Update all fields directly on the row object
    row.custom_total = custom_total;
    row.custom_total_value = total_value;
    row.custom_total_in_inr = total_value;
    row.rate = total_value;
    row.price_list_rate = total_value;

    // Calculate amount
    calculate_item_amount(frm, row);
}

// =======================================================
// HELPER: CLEAR ROW VALUES
// =======================================================
function clear_row_values(frm, row) {
    row.custom_total = 0;
    row.custom_total_value = 0;
    row.custom_total_in_inr = 0;
    row.rate = 0;
    row.price_list_rate = 0;
    row.amount = 0;
}

// =======================================================
// CALCULATE ITEM AMOUNT
// =======================================================
function calculate_item_amount(frm, row) {
    row.amount = flt(row.rate * row.qty, 2);
}

// =======================================================
// CALCULATE TOTALS (Bottom of form)
// =======================================================
function calculate_totals(frm) {
    let total = 0;
    
    (frm.doc.items || []).forEach(row => {
        total += flt(row.amount || 0);
    });
    
    frm.doc.total = flt(total, 2);
    frm.doc.net_total = flt(total, 2);
    frm.doc.grand_total = flt(total, 2);
    
    frm.refresh_fields(["total", "net_total", "grand_total"]);
}