#!/usr/bin/env python

import argparse
import json
from collections import defaultdict

from platformio.package.manager.platform import PlatformPackageManager

HARVARD_ARCHS = [
    "8051",
    "8052",
    "AT90",
    "ATMEGA",
    "ATTINY",
    "AVR",
    "ESP8266",
    "IAP12",
    "IAP15",
    "IRC15",
    "ML5",
    "MS5",
    "N7",
    "STC",
    "W79",
    "STM8",
]

MEMORY_MODELS = {
    "8-bit": [
        "8051",
        "8052",
        "AT89",
        "AT90",
        "ATMEGA",
        "ATTINY",
        "AVR",
        "CH559",
        "IAP12",
        "IAP15",
        "IRC15",
        "ML5",
        "MS5",
        "N7",
        "STC",
        "W79",
        "STM8",
    ],
    "16-bit": [
        "MSP430",
    ],
    "32-bit": [
        "32MX",
        "32MZ",
        "AM130",
        "ARCV2EM",
        "ASR",
        "AT91SAM",
        "BCM283",
        "BCM2835",
        "BK7231",
        "BK7252",
        "C-CLASS",
        "CORTEX",
        "E-CLASS",
        "EFM32",
        "EFR32",
        "ESP32",
        "ESP8266",
        "FE310",
        "FU540",
        "GAP8",
        "GD32VF103CBT6",
        "GD32VF103VBT6",
        "HUMMINGBIRD",
        "ICE40-HX1K-TQ144",
        "IMXRT1062",
        "K1921",
        "LPC",
        "LPLM4",
        "LPTM4",
        "MAX32",
        "MIMXRT",
        "MK",
        "MT2503",
        "MT2625",
        "MT6261",
        "NRF5",
        "R7FA6M5BH2CBG",
        "RA4M1",
        "RDA89",
        "RP2040",
        "RTL8710B",
        "SAM",
        "STM32",
        "XMC",
    ],
    "64-bit": [
        "K210",
        "RTL8720CF",
    ],
}


def get_memory_model(mcu: str):
    for model, prefixes in MEMORY_MODELS.items():
        for prefix in prefixes:
            if mcu.startswith(prefix):
                return model


def is_harvard(mcu: str):
    for prefix in HARVARD_ARCHS:
        if mcu.startswith(prefix):
            return True
    return False


def get_boards():
    pm = PlatformPackageManager()
    unknown_mcus = defaultdict(list)
    for board in pm.get_all_boards():
        mcu = board["mcu"]
        if not mcu:
            continue
        memory_model = get_memory_model(mcu)
        if not memory_model:
            unknown_mcus[mcu].append(board["name"])
            continue
        yield board["id"], {
            "label": board["name"],
            "ram": board["ram"],
            "memoryModel": memory_model,
            "progmem": is_harvard(mcu),
        }

    for mcu, boards in sorted(
        unknown_mcus.items(),
        key=lambda item: len(item[1]),
        reverse=True,
    ):
        title = f"Unknown MCU {mcu}"
        if len(boards) > 3:
            title += f" ({len(boards)} boards)"
        msg = f"{mcu} is used in {', '.join(boards[0:3])}"
        if len(boards) > 3:
            msg += f" and {len(boards) - 3} more"
        print(f"::warning title={title}::{msg}")


parser = argparse.ArgumentParser(description="Update boards.json")
parser.add_argument(
    "--output",
    type=str,
    default="src/assets/boards.json",
    help="output file",
)
parser.add_argument(
    "--all",
    action="store_true",
    help="include all boards (not only Arduino)",
)

args = parser.parse_args()

with open(args.output, "wt") as f:
    json.dump(
        {
            board_id: {key: value for key, value in board.items() if value}
            for board_id, board in get_boards()
            if board["label"].startswith("Arduino") or args.all
        },
        f,
        indent=2,
    )
