#!/usr/bin/env python

import argparse
import json
import re
from collections import defaultdict

from platformio.package.manager.platform import PlatformPackageManager

MCU_BITS = {
    8: [
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
    16: [
        "MSP430",
    ],
    32: [
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
    64: [
        "K210",
        "RTL8720CF",
    ],
}


# Clean up board name
# "Adafruit Pro Trinket 3V/12MHz (FTDI)" => "Adafruit Pro Trinket"
# "Adafruit Pro Trinket 3V/12MHz (USB)" => "Adafruit Pro Trinket"
# "Arduino Due (Programming Port)" => "Arduino Due"
# "Arduino Due (USB Native Port)" => "Arduino Due"
# "Arduino M0 Pro (Native USB Port)" => "Arduino M0 Pro"
# "Arduino M0 Pro (Programming/Debug Port)" => "Arduino M0 Pro"
# "Arduino Nano ATmega328 (New Bootloader)" => "Arduino Nano"
# "Arduino Pro or Pro Mini ATmega168 (3.3V, 8 MHz)" => "Arduino Pro or Pro Mini"
# "Sanguino ATmega1284p (16MHz)" => "Sanguino ATmega1284p"
NAME_REGEX = re.compile(
    r"(?:\s+\dV/\d+MHz)?\s+\((?:Native USB Port|Programming Port|Debug Port|Programming/Debug Port|FTDI|USB|New Bootloader|3.3V,\s*\d+\s*MHz|\d+\s*MHz)\)$"
)


def clean_name(name: str) -> str:
    return NAME_REGEX.sub("", name)


def get_mpu_bits(mcu: str) -> int:
    for bits, prefixes in MCU_BITS.items():
        for prefix in prefixes:
            if mcu.startswith(prefix):
                return bits
    return 0


def get_boards():
    pm = PlatformPackageManager()
    unknown_mcus = defaultdict(list)
    previous_board = None
    for board in pm.get_all_boards():
        mcu = board["mcu"]
        if not mcu:
            continue
        bits = get_mpu_bits(mcu)
        if not bits:
            unknown_mcus[mcu].append(board["name"])
            continue
        cleaned_board = {
            "name": clean_name(board["name"]),
            "ram": board["ram"],
            "bits": bits,
        }
        if previous_board == cleaned_board:
            continue
        yield board["id"], cleaned_board
        previous_board = cleaned_board

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
            board_id: board
            for board_id, board in get_boards()
            if board["name"].startswith("Arduino") or args.all
        },
        f,
        indent=2,
    )
