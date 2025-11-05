import {
	AnimatedSpan,
	Terminal,
	TypingAnimation,
} from "@/components/ui/terminal";
import { HeartPointer } from "../ui/heart-pointer";

export function ContextInputProcessing() {
	return (
		<div className="">
			<HeartPointer />
			<div className="w-full space-y-4">
				<Terminal>
					<TypingAnimation>$ analyzing company documents...</TypingAnimation>

					<AnimatedSpan className="text-blue-500">
						✓ Extracted company name and industry
					</AnimatedSpan>

					<TypingAnimation>
						$ processing context and relationships...
					</TypingAnimation>

					<AnimatedSpan className="text-yellow-500">
						→ Building knowledge graph
					</AnimatedSpan>

					<TypingAnimation>$ generating company profile...</TypingAnimation>

					<AnimatedSpan className="text-green-500">
						✓ Company profile created successfully
					</AnimatedSpan>

					<AnimatedSpan className="text-purple-500">
						→ Just a moment...
					</AnimatedSpan>
				</Terminal>
			</div>
		</div>
	);
}
