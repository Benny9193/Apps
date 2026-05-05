import argparse
import sys


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="app", description="python-cli template")
    parser.add_argument("--name", default="world", help="who to greet")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    print(f"hello, {args.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
