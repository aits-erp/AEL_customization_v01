import frappe
from erpnext.selling.doctype.quotation.quotation import Quotation as _Quotation
from frappe.model.mapper import get_mapped_doc
from frappe.utils import flt


class Quotation(_Quotation):

    def validate(self):
        # 1. Dimension row calculations
        self.update_dimension_rows()

        # 2. Parent dimension totals
        self.update_dimension_totals()

        # 3. Item-level business calculations
        self.update_custom_item_totals()

        # 4. Push final INR value into standard rate
        # self.sync_standard_rate_from_custom_total()

        super().validate()


    # -----------------------------------------------------------
    # ITEM TOTAL CALCULATIONS (BUSINESS LOGIC)
    # -----------------------------------------------------------
    def update_custom_item_totals(self):

        mode = (self.custom_mode or "").upper()

        totals = self.get_effective_totals()

        for item in self.items:

            user_rate = flt(item.custom_custom_rate)
            exchange_rate = flt(item.custom_exchange_rate)
            
            # ---------- FORMULA PATH ----------
            # if item.custom_formula:

            #     calculated = None
            if item.custom_formula:

                # stop calculation if required fields missing
                if not item.custom_custom_rate or not item.custom_exchange_rate:
                    item.custom_total = 0
                    item.custom_total_value = 0
                    item.custom_total_in_inr = 0
                    item.rate = 0
                    continue

                calculated = None

                if mode in (
                    "SEA - LCL IMPORT",
                    "SEA - LCL EXPORT",
                    "SEA - FCL IMPORT",
                    "SEA - FCL EXPORT"
                ):
                    calculated = totals["cbm"] * user_rate

                elif mode in ("AIR - IMPORT", "AIR - EXPORT"):
                    chargeable_weight = max(
                        totals["weight"],
                        totals["volume_weight"]
                    )
                    calculated = chargeable_weight * user_rate

                if calculated is not None:
                    item.custom_total = calculated

            # ---------- INR CONVERSION ----------
            item.custom_total_value = flt(item.custom_total) * exchange_rate
            item.custom_total_in_inr = item.custom_total_value
            item.price_list_rate = item.custom_total_value
            item.rate = item.custom_total_value
            item.discount_percentage = 0
            item.discount_amount = 0
            item.cgst_amount = 0
            item.sgst_amount = 0
            item.igst_amount = 0
            item.cess_amount = 0
            item.taxable_value = item.custom_total_value

    # -----------------------------------------------------------
    # DIMENSION ROW CALCULATION
    # -----------------------------------------------------------
    def update_dimension_rows(self):

        mode = (self.custom_mode or "").upper()
        divisor = 5000.0 if mode.startswith("COURIER") else 6000.0

        for row in self.custom_dimension_details:

            L = flt(row.length_cm)
            B = flt(row.breadth_cm)
            H = flt(row.dim_height_cm)
            boxes = flt(row.number_of_boxes or 1)

            row.custom_cbm = (L * B * H / 1000000.0) * boxes
            row.volume_weight = (L * B * H / divisor) * boxes


    # -----------------------------------------------------------
    # PARENT DIMENSION TOTALS
    # -----------------------------------------------------------
    def update_dimension_totals(self):

        total_cbm = 0.0
        total_weight = 0.0
        total_volume_weight = 0.0
        total_boxes = 0.0

        for row in self.custom_dimension_details:

            total_cbm += flt(row.custom_cbm)
            total_weight += flt(row.weight_kg)
            total_volume_weight += flt(row.volume_weight)
            total_boxes += flt(row.number_of_boxes)

        total_cbm = flt(total_cbm, 2)

        self.custom_totals_in_cbm = total_cbm
        self.custom_gross_weight = total_weight

        self.custom_total_cbm = total_cbm
        self.custom_total_weight = total_weight
        self.custom_total_volume_weight = total_volume_weight
        self.custom_total_no_of_boxes = total_boxes


    # -----------------------------------------------------------
    # SYNC STANDARD RATE (REPORT-SAFE)
    # -----------------------------------------------------------
    def sync_standard_rate_from_custom_total(self):

        for item in self.items:

            final_inr = flt(item.custom_total_in_inr)

            if final_inr:
                item.rate = final_inr


    # -----------------------------------------------------------
    # TOTAL SOURCE DECISION
    # -----------------------------------------------------------
    def get_effective_totals(self):

        has_dimensions = any(
            flt(row.custom_cbm) > 0 or flt(row.weight_kg) > 0
            for row in self.custom_dimension_details
        )

        if has_dimensions:
            return {
                "cbm": flt(self.custom_total_cbm),
                "weight": flt(self.custom_total_weight),
                "volume_weight": flt(self.custom_total_volume_weight),
            }

        return {
            "cbm": flt(self.custom_totals_in_cbm),
            "weight": flt(self.custom_gross_weight),
            "volume_weight": flt(self.custom_total_volume_weight),
        }


# -----------------------------------------------------------
# SALES ORDER MAPPING
# -----------------------------------------------------------

def map_parent_fields(source, target, source_parent=None):

    FIELD_MAP = {

        "custom_gross_weight": "custom_gross_wt",

        "custom_pol": "custom_pol_aol",
        "custom_pod": "custom_pod_aod",

        "custom_eta": "custom_eta",
        "custom_etd": "custom_etd",

        "custom_country_of_origin": "custom_country_origin",
        "party_name": "custom_consignee",

        "custom_total_cbm": "custom_cbm",
        "custom_total_no_of_boxes": "custom_no_of_pkgs",

        "party_name": "customer",
    }

    for src_field, tgt_field in FIELD_MAP.items():
        if hasattr(source, src_field) and hasattr(target, tgt_field):
            target.set(tgt_field, source.get(src_field))


@frappe.whitelist()
def make_sales_order(source_name, target_doc=None):

    def map_dimension_child(source_row, target_row, source_parent):

        target_row.no_of_boxes = source_row.number_of_boxes
        target_row.length_cm = source_row.length_cm
        target_row.breadth_cm = source_row.breadth_cm
        target_row.height_cm = source_row.dim_height_cm
        target_row.weight_kg = source_row.weight_kg
        target_row.volume_weight = source_row.volume_weight
        target_row.cbm = flt(source_row.custom_cbm)

    doc = get_mapped_doc(
        "Quotation",
        source_name,
        {

            "Quotation": {
                "doctype": "Sales Order",
                "postprocess": map_parent_fields,
            },

            "Quotation Item": {
                "doctype": "Sales Order Item",
                "field_map": {
                    "name": "quotation_item",
                    "parent": "quotation",
                    "custom_formula": "custom_formulaa",
                },
            },

            "Quotation Dimension Detail": {
                "doctype": "SO Dimension details",
                "parent_field": "custom_dimension_table",
                "postprocess": map_dimension_child,
            },
        },
        target_doc,
    )

    return doc