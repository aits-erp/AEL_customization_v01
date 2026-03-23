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

    row.custom_formula = 0;
    row.rate = 0;
    row.custom_total = 0;
    row.custom_total_in_inr = 0;

    setTimeout(() => {
        toggle_custom_total_edit(frm, row);
    }, 100);

},

    // item_code(frm, cdt, cdn) {
    //     // prevent ERPNext auto price fetch
    //     setTimeout(() => {
    //         frappe.model.set_value(cdt, cdn, "rate", 0);
    //         frappe.model.set_value(cdt, cdn, "price_list_rate", 0);
    //     }, 100);
    // },
    item_code(frm, cdt, cdn) {

        let row = locals[cdt][cdn];

        // always reset rate when item selected
        frappe.model.set_value(cdt, cdn, "rate", 0);
        frappe.model.set_value(cdt, cdn, "price_list_rate", 0);

        // delay override to defeat ERPNext price fetch
        setTimeout(() => {

            frappe.model.set_value(cdt, cdn, "rate", 0);
            frappe.model.set_value(cdt, cdn, "price_list_rate", 0);

        }, 300);

    },

    custom_custom_rate(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.custom_formula) {
            calculate_row(frm, locals[cdt][cdn]);
        } else {
            calculate_row(frm, locals[cdt][cdn]);
        }
    },

    custom_exchange_rate(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.custom_formula) {
            calculate_row(frm, locals[cdt][cdn]);
        } else {
            calculate_row(frm, locals[cdt][cdn]);
        }
    },

    custom_formula(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        toggle_custom_total_edit(frm, row);

        if (row.custom_formula) {
            calculate_row(frm, locals[cdt][cdn]);
        } else {
            calculate_row(frm, locals[cdt][cdn]);
        }
    },


    custom_total(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row.custom_formula) {
            calculate_row(frm, locals[cdt][cdn]);
        }
    }

});


// =======================================================
// GRID FIELD CONTROL
// =======================================================

function toggle_custom_total_edit(frm, row) {

    const grid_row = frm.fields_dict.items.grid.grid_rows_by_docname[row.name];

    if (!grid_row) return;

    const editable = !row.custom_formula;

    grid_row.toggle_editable("custom_total", editable);

}


// =======================================================
// ITEM FORMULA CALCULATION
// =======================================================

// function recalc_item_row(frm, row) {

//     if (!row || !row.custom_formula) return;

//     let mode = (frm.doc.custom_mode || "").toUpperCase();
//     let user_rate = flt(row.custom_custom_rate);
//     let exchange_rate = flt(row.custom_exchange_rate);

//     if (!user_rate || !exchange_rate) {
//         frappe.model.set_value(row.doctype, row.name, "custom_total", 0);
//         frappe.model.set_value(row.doctype, row.name, "custom_total_value", 0);
//         frappe.model.set_value(row.doctype, row.name, "custom_total_in_inr", 0);
//         frappe.model.set_value(row.doctype, row.name, "rate", 0);
//         return;
//     }

//     const totals = get_effective_totals(frm);

//     let value = null;

//     if (SEA_MODES.has(mode)) {
//         value = totals.cbm * user_rate;
//     }
//     else if (AIR_MODES.has(mode)) {
//         value = Math.max(totals.weight, totals.volume_weight) * user_rate;
//     }

//     if (value !== null) {
//         frappe.model.set_value(row.doctype, row.name, "custom_total", value);
//     }

//     let total_value = flt(value) * exchange_rate;

//     frappe.model.set_value(row.doctype, row.name, "custom_total_value", total_value);
//     frappe.model.set_value(row.doctype, row.name, "custom_total_in_inr", total_value);
//     frappe.model.set_value(row.doctype, row.name, "rate", total_value);

// }


// =======================================================
// MANUAL CALCULATION
// =======================================================
// function recalc_manual_row(frm, row) {

//     let user_rate = flt(row.custom_custom_rate);
//     let exchange_rate = flt(row.custom_exchange_rate);
//     let current_total = flt(row.custom_total);

//     if (!exchange_rate) return;

//     // ✅ AUTO-FILL ONLY IF TOTAL IS EMPTY OR ZERO
//     if (!current_total && user_rate) {
//         frappe.model.set_value(row.doctype, row.name, "custom_total", user_rate);
//         current_total = user_rate;
//     }

//     if (!current_total) return;

//     let total_value = current_total * exchange_rate;

//     frappe.model.set_value(row.doctype, row.name, "custom_total_value", total_value);
//     frappe.model.set_value(row.doctype, row.name, "custom_total_in_inr", total_value);
//     frappe.model.set_value(row.doctype, row.name, "rate", total_value);
// }

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

    weight_kg(frm) {
        update_dimension_totals(frm);
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

    row.custom_cbm = flt((L * B * H / 1000000) * boxes);

    let divisor = (frm.doc.custom_mode || "").toUpperCase().startsWith("COURIER")
        ? 5000
        : 6000;

    row.volume_weight = flt((L * B * H / divisor) * boxes);

    update_dimension_totals(frm);

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

    frm.set_value("custom_total_no_of_boxes", total_boxes);
    frm.set_value("custom_total_cbm", total_cbm);
    frm.set_value("custom_total_weight", total_weight);
    frm.set_value("custom_total_volume_weight", total_volume_weight);

    frm.set_value("custom_totals_in_cbm", total_cbm);
    frm.set_value("custom_gross_weight", total_weight);

    recalc_all_items(frm);

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

        }, 100);

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

        const cbm = flt(frm.doc.custom_totals_in_cbm || 0);
        frm.set_value("custom_total_cbm", cbm);

        recalc_all_items(frm);

    },

    custom_gross_weight(frm) {

        const wt = flt(frm.doc.custom_gross_weight || 0);
        frm.set_value("custom_total_weight", wt);

        recalc_all_items(frm);

    }

});


// =======================================================
// RECALCULATE ALL ITEMS
// =======================================================

function recalc_all_items(frm) {

    (frm.doc.items || []).forEach(row => {

        if (row.custom_formula) {
            recalc_item_row(frm, row);
        }

    });

}


// =======================================================
// DETERMINE TOTAL SOURCE
// =======================================================

function get_effective_totals(frm) {

    const has_dimensions =
        (frm.doc.custom_dimension_details || []).some(r =>
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
// FINAL CENTRALIZED CALCULATION FUNCTION
// =======================================================
function calculate_row(frm, row) {

    let user_rate = flt(row.custom_custom_rate);
    let exchange_rate = flt(row.custom_exchange_rate);
    let total = flt(row.custom_total);

    // allow 0 exchange but not empty
    if (exchange_rate === null || exchange_rate === undefined) return;

    // =============================
    // FORMULA MODE
    // =============================
    if (row.custom_formula) {

        if (!user_rate) return;

        let totals = get_effective_totals(frm);
        let mode = (frm.doc.custom_mode || "").toUpperCase();

        if (SEA_MODES.has(mode)) {
            total = totals.cbm * user_rate;
        } else if (AIR_MODES.has(mode)) {
            total = Math.max(totals.weight, totals.volume_weight) * user_rate;
        }

        frappe.model.set_value(row.doctype, row.name, "custom_total", total);
    }

    // =============================
    // MANUAL MODE
    // =============================
    else {

        // auto-fill only if empty
        if (!total && user_rate) {
            total = user_rate;
            frappe.model.set_value(row.doctype, row.name, "custom_total", total);
        }

        if (!total) return;
    }

    // =============================
    // FINAL CALC
    // =============================
    let total_value = total * exchange_rate;

    frappe.model.set_value(row.doctype, row.name, "custom_total_value", total_value);
    frappe.model.set_value(row.doctype, row.name, "custom_total_in_inr", total_value);
    frappe.model.set_value(row.doctype, row.name, "rate", total_value);
}