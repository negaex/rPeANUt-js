#!/usr/bin/env python

"""
An assembler for rPeANUt.

Assembles rPeANUt assembly code into rPeANUt machine code.
"""

import re

instructions = {
  "halt": 0x0,
  "add": 0x1,
  "sub": 0x2,
  "mult": 0x3,
  "div": 0x4,
  "mod": 0x5,
  "and": 0x6,
  "or": 0x7,
  "xor": 0x8,
  "neg": 0xA0,
  "not": 0xA1,
  "move": 0xA2,
  "call": 0xA300,
  "return": 0xA301,
  "trap": 0xA302,
  "jump": 0xA400,
  "jumpz": 0xA41,
  "jumpn": 0xA42,
  "jumpnz": 0xA43,
  "reset": 0xA50,
  "set": 0xA51,
  "push": 0xA60,
  "pop": 0xA61,
  # immediate rotate
  # register rotate
  # immediate load
  # absolute load
  # indirect load
  # base + displacement load
  # absolute store
  # indirect store
  # base + displacement store
}

registers = {
  "R0": 0x0,
  "R1": 0x1,
  "R2": 0x2,
  "R3": 0x3,
  "R4": 0x4,
  "R5": 0x5,
  "R6": 0x6,
  "R7": 0x7
}

def validate_registers(*registers):
  """Raise an exception if registers are not within range 0x0-0x7,
    i.e. if the registers are invalid or do not exist."""

  if not all((0x0 <= register <= 0x7 for register in registers)):
    raise ValueError("Registers must be within range 0x0-0x7.")

def validate_address(address):
  """Raise an exception if the address is not with in range 0x0000-0xFFFF,
    i.e. if the address is invalid or does not exist."""

  if not (0x0000 <= address <= 0xFFFF):
    raise ValueError("Address must be within range 0x0000-0xFFFF.")

def assemble_instruction(instruction, A=0x0, B=0x0, C=0x0):
  """Assemble some hexadecimal instruction and its arguments."""

  if (instruction == 0x0):
    # Halt.
    return 0x00000000

  if (0x1 <= instruction <= 0x8 or instruction == 0xE):
    # This is a binary operation which takes two registers and stores in one.
    # 0x<INSTRUCTION><RS1><RS2><RD>0000
    validate_registers(A, B, C)
    return (0x10000000 * instruction +
            0x01000000 * A +
            0x00100000 * B +
            0x00010000 * C)

  if (0xA0 <= instruction <= 0xA2 or instruction in {0xC2, 0xD2}):
    # This is a unary operation which takes one register and stores in one.
    # 0x<INSTRUCTION><RS><RD>0000
    validate_registers(A, B)
    return (0x01000000 * instruction +
            0x00100000 * A +
            0x00010000 * B)

  if (instruction in {0xA301, 0xA302, 0x0000}):
    # This is an instruction which takes no arguments.
    # 0x<INSTRUCTION>0000
    return (0x00010000 * instruction)

  if (instruction in {0xA300, 0xA400}):
    # This is an instruction which takes one address as an argument.
    validate_address(A)
    # 0x<INSTRUCTION><ADDRESS>
    return (0x00010000 * instruction +
            0x00000001 * A)

  if (0xA41 <= instruction <= 0xA43):
    # This is an instruction which takes a register and an address.
    validate_registers(A)
    validate_address(B)
    # 0x<INSTRUCTION><R><ADDRESS>
    return (0x00100000 * instruction +
            0x00010000 * A +
            0x00000001 * B)

  if (instruction in {0xA50, 0xA51, 0xA60, 0xA61}):
    # This is an instruction which takes a bit or a register.
    # By virtue of the way the processor is constructed, the number
    # of bits is the same as the number of processors, so the same
    # validation function works on both.
    validate_registers(A)
    # 0x<INSTRUCTION><R|BIT>0000
    return (0x00100000 * instruction +
            0x00010000 * A)

  if (instruction == 0xB0):
    # Bit left rotate, using immediate.
    # TODO: Validate literals.
    validate_registers(B, C)
    # 0x<INSTRUCTION><RS><RD>00<AMOUNT>
    return (0x01000000 * instruction +
            0x00100000 * B +
            0x00010000 * C +
            0x00000001 * A)

  if (instruction == 0xC00):
    # Immediate load from memory.
    # TODO: Validate literals.
    validate_registers(B)
    # 0x<INSTRUCTION><RD><VALUE>
    return (0x00100000 * instruction +
            0x00010000 * B +
            0x00000001 * A)

  if (instruction == 0xC10):
    # Absolute load from memory.
    validate_address(A)
    validate_registers(B)
    # 0x<INSTRUCTION><RD><ADDRESS>
    return (0x00100000 * instruction +
            0x00010000 * B +
            0x00000001 * A)

  if (instruction in {0xC3, 0xD3}):
    # Base + displacement load/store.
    # TODO: Validate literals.
    validate_registers(A, C)
    # 0x<INSTRUCTION><RSA><RD><VALUE>
    return (0x01000000 * instruction +
            0x00100000 * A +
            0x00010000 * C +
            0x00000001 * B)

  if (instruction == 0xD1):
    # Absolute store.
    validate_registers(A)
    validate_address(B)
    # 0x<INSTRUCTION><RS>0<ADDRESS>
    return (0x01000000 * instruction +
            0x00100000 * A +
            0x00000001 * B)

  raise ValueError("Unknown instruction.")

def assemble(code):
  """Converts a string of assembly code into machine code."""

  machine_code = [] # Temporarily stores output machine code.

  for line in code.split("\n"):
    # Ideally, I would assert that the line is valid rPeANUt code here,
    # but for simplicity I won't. Potential improvement?

    # If the line is empty, we don't need to care about it.
    if not line: continue

    # When labels are implemented, they'll appear here.

    # Split into arguments.
    line = filter(None, re.split(r"\s+", line))
    line[0] = instructions[line[0]]
    line = [line[0]] + [registers[i] for i in line[1:]]

    machine_code.append(assemble_instruction(*line))
  return machine_code

if __name__ == '__main__':
  print map(hex, assemble("""
    call R1
    sub R2 R1 R3
    halt"""))
